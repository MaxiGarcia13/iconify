import { Buffer } from 'node:buffer';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { solidPng } from '../../test/fixtures';
import { ASSET_MATRIX } from './matrix';
import { passthroughFaviconSvg, renderIcon, renderOgImage } from './process';

const SQUARE_PNG_ENTRIES = ASSET_MATRIX.filter(
  (entry) => entry.format === 'png' && entry.size.kind === 'square',
);

describe('renderIcon', () => {
  it.each(
    SQUARE_PNG_ENTRIES.map((entry) => ({
      name: entry.name,
      px: entry.size.kind === 'square' ? entry.size.px : 0,
    })),
  )(
    'produces $name at $px×$px (SPEC §2)',
    async ({ px }) => {
      const input = await solidPng();
      const out = await renderIcon(input, px, {
        background: 'transparent',
        padding: 0,
        cornerRadius: 0,
        monochrome: false,
      });

      const meta = await sharp(out).metadata();
      expect(meta.format).toBe('png');
      expect(meta.width).toBe(px);
      expect(meta.height).toBe(px);
    },
  );
});

describe('applyCornerRadius via renderIcon (SPEC §4.3 / AC8)', () => {
  const size = 64;
  const optionsBase = {
    background: '#0080ff' as const,
    padding: 0,
    monochrome: false,
  };

  /** Alpha of pixel (x, y) in a raw RGBA buffer. */
  async function pixelAlpha(
    png: Buffer,
    x: number,
    y: number,
  ): Promise<number> {
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const idx = (y * info.width + x) * info.channels;
    return data[idx + 3]!;
  }

  it('is a no-op at cornerRadius=0 (square corners remain opaque)', async () => {
    const input = await solidPng(size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      cornerRadius: 0,
    });

    expect(await pixelAlpha(out, 0, 0)).toBe(255);
    expect(await pixelAlpha(out, size - 1, 0)).toBe(255);
    expect(await pixelAlpha(out, 0, size - 1)).toBe(255);
    expect(await pixelAlpha(out, size - 1, size - 1)).toBe(255);
    expect(await pixelAlpha(out, size / 2, size / 2)).toBe(255);
  });

  it('at cornerRadius=100 yields a circle (corners transparent, center opaque)', async () => {
    const input = await solidPng(size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      cornerRadius: 100,
    });

    // r = round((100/100) * (64/2)) = 32 → outer corners outside the disc
    expect(await pixelAlpha(out, 0, 0)).toBe(0);
    expect(await pixelAlpha(out, size - 1, 0)).toBe(0);
    expect(await pixelAlpha(out, 0, size - 1)).toBe(0);
    expect(await pixelAlpha(out, size - 1, size - 1)).toBe(0);
    expect(await pixelAlpha(out, size / 2, size / 2)).toBe(255);
  });

  it('applies partial radius mask math at cornerRadius=50', async () => {
    const input = await solidPng(size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      cornerRadius: 50,
    });

    // r = round((50/100) * 32) = 16 → corners cut, mid-edge and center stay
    expect(await pixelAlpha(out, 0, 0)).toBe(0);
    expect(await pixelAlpha(out, size / 2, 0)).toBe(255);
    expect(await pixelAlpha(out, size / 2, size / 2)).toBe(255);
  });
});

describe('applyCornerRadius via renderOgImage (SPEC §4.5)', () => {
  it('rounds OG canvas corners at cornerRadius=100', async () => {
    const input = await solidPng(200);
    const out = await renderOgImage(input, {
      background: '#0080ff',
      padding: 0,
      cornerRadius: 100,
      monochrome: false,
    });

    const { data, info } = await sharp(out)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alphaAt = (x: number, y: number) =>
      data[(y * info.width + x) * info.channels + 3]!;

    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(info.width - 1, 0)).toBe(0);
    expect(alphaAt(Math.floor(info.width / 2), Math.floor(info.height / 2))).toBe(
      255,
    );
  });

  it('leaves OG corners square at cornerRadius=0', async () => {
    const input = await solidPng(200);
    const out = await renderOgImage(input, {
      background: '#0080ff',
      padding: 0,
      cornerRadius: 0,
      monochrome: false,
    });

    const { data, info } = await sharp(out)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(255);
    expect(data[((info.height - 1) * info.width) * info.channels + 3]).toBe(255);
  });
});

describe('renderOgImage', () => {
  it('returns a 1200×630 PNG for og-image.png (SPEC §2.4 / §4.5)', async () => {
    const input = await solidPng(200);
    const out = await renderOgImage(input, {
      background: 'transparent',
      padding: 10,
      cornerRadius: 0,
      monochrome: false,
    });

    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });
});

describe('passthroughFaviconSvg', () => {
  it('preserves SVG markup for favicon.svg (SPEC §2.1 / §4.8 / AC2)', () => {
    const source = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#0af"/></svg>',
      'utf8',
    );

    const out = passthroughFaviconSvg(source);
    const text = out.toString('utf8');

    expect(text).toContain('<svg');
    expect(text).toContain('viewBox="0 0 32 32"');
    expect(text).toContain('<circle');
    expect(text).not.toMatch(/^\x89PNG/);
  });

  it('strips script and event handlers before ZIP storage', () => {
    const source = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><script>alert(2)</script><rect width="10" height="10"/></svg>',
      'utf8',
    );

    const text = passthroughFaviconSvg(source).toString('utf8');

    expect(text).not.toContain('<script');
    expect(text).not.toContain('onclick');
    expect(text).toContain('<rect');
  });
});
