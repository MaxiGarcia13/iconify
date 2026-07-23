import { Buffer } from 'node:buffer';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import {
  alphaPng,
  emptyTransparentPng,
  halfTransparentPng,
  solidPng,
} from '@/test/fixtures';
import { ASSET_MATRIX } from './matrix';
import {
  passthroughFaviconSvg,
  renderIcon,
  renderOgImage,
  renderOriginal,
} from './process';

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

describe('renderOriginal (SPEC §2.5 / §4.6 / AC11)', () => {
  const optionsBase = {
    background: 'transparent' as const,
    padding: 0,
    cornerRadius: 0,
    monochrome: false,
  };

  it('keeps source metadata width×height (non-square OK)', async () => {
    const input = await solidPng(120, 80);
    const out = await renderOriginal(input, optionsBase);

    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(120);
    expect(meta.height).toBe(80);
  });

  it('applies padding without changing canvas size', async () => {
    const input = await solidPng(100, 50);
    const out = await renderOriginal(input, {
      ...optionsBase,
      padding: 20,
      background: '#ffffff',
    });

    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(50);
  });

  it('applies monochrome greyscale when enabled', async () => {
    const input = await solidPng(64, 48);
    const out = await renderOriginal(input, {
      ...optionsBase,
      monochrome: true,
    });

    const { data, info } = await sharp(out)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = Math.floor(info.width / 2);
    const y = Math.floor(info.height / 2);
    const idx = (y * info.width + x) * info.channels;
    const rgb = [data[idx]!, data[idx + 1]!, data[idx + 2]!];
    expect(rgb[0]).toBe(rgb[1]);
    expect(rgb[1]).toBe(rgb[2]);
  });

  it('applies cornerRadius mask on native canvas', async () => {
    const input = await solidPng(64, 64);
    const out = await renderOriginal(input, {
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
    expect(alphaAt(Math.floor(info.width / 2), Math.floor(info.height / 2))).toBe(
      255,
    );
  });
});

describe('monochrome greyscale via renderIcon / renderOgImage (SPEC §4 / AC10)', () => {
  const optionsBase = {
    background: 'transparent' as const,
    padding: 0,
    cornerRadius: 0,
  };

  /** Center pixel RGB from a raw RGBA PNG buffer. */
  async function centerRgb(
    png: Buffer,
  ): Promise<readonly [number, number, number]> {
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = Math.floor(info.width / 2);
    const y = Math.floor(info.height / 2);
    const idx = (y * info.width + x) * info.channels;
    return [data[idx]!, data[idx + 1]!, data[idx + 2]!];
  }

  function chroma(rgb: readonly [number, number, number]): number {
    return Math.max(...rgb) - Math.min(...rgb);
  }

  it('renderIcon monochrome=true yields greyscale (chroma ≈ 0)', async () => {
    const input = await solidPng(64);
    const out = await renderIcon(input, 64, {
      ...optionsBase,
      monochrome: true,
    });

    const rgb = await centerRgb(out);
    expect(rgb[0]).toBe(rgb[1]);
    expect(rgb[1]).toBe(rgb[2]);
    expect(chroma(rgb)).toBe(0);
  });

  it('renderIcon monochrome=false keeps source colors', async () => {
    const input = await solidPng(64);
    const out = await renderIcon(input, 64, {
      ...optionsBase,
      monochrome: false,
    });

    const rgb = await centerRgb(out);
    // solidPng is #0080ff — distinct channels when color is preserved
    expect(chroma(rgb)).toBeGreaterThan(0);
    expect(rgb[0]).not.toBe(rgb[2]);
  });

  it('renderOgImage monochrome=true yields greyscale (chroma ≈ 0)', async () => {
    const input = await solidPng(200);
    const out = await renderOgImage(input, {
      ...optionsBase,
      monochrome: true,
    });

    const rgb = await centerRgb(out);
    expect(rgb[0]).toBe(rgb[1]);
    expect(rgb[1]).toBe(rgb[2]);
    expect(chroma(rgb)).toBe(0);
  });

  it('renderOgImage monochrome=false keeps source colors', async () => {
    const input = await solidPng(200);
    const out = await renderOgImage(input, {
      ...optionsBase,
      monochrome: false,
    });

    const rgb = await centerRgb(out);
    expect(chroma(rgb)).toBeGreaterThan(0);
  });
});

describe('transparent PNG + opaque background (SPEC §4.9)', () => {
  const size = 64;
  const opaqueBg = '#00ff00' as const;
  const optionsBase = {
    padding: 0,
    cornerRadius: 0,
    monochrome: false,
  };

  async function rgbaAt(
    png: Buffer,
    x: number,
    y: number,
  ): Promise<readonly [number, number, number, number]> {
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const idx = (y * info.width + x) * info.channels;
    return [data[idx]!, data[idx + 1]!, data[idx + 2]!, data[idx + 3]!];
  }

  it('renderIcon: opaque bg fills transparent source pixels (pad zone + holes)', async () => {
    const input = await halfTransparentPng(size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      background: opaqueBg,
      padding: 20,
    });

    // Pad corner → solid green
    expect(await rgbaAt(out, 0, 0)).toEqual([0, 255, 0, 255]);
    // Content left half → red
    expect(await rgbaAt(out, Math.floor(size / 4), Math.floor(size / 2))).toEqual([
      255,
      0,
      0,
      255,
    ]);
    // Content right half was transparent → green canvas
    expect(await rgbaAt(out, Math.floor((3 * size) / 4), Math.floor(size / 2))).toEqual([
      0,
      255,
      0,
      255,
    ]);
  });

  it('renderIcon: transparent bg preserves alpha holes (PNG stays alpha)', async () => {
    const input = await halfTransparentPng(size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      background: 'transparent',
    });

    expect(await rgbaAt(out, Math.floor(size / 4), Math.floor(size / 2))).toEqual([
      255,
      0,
      0,
      255,
    ]);
    // Right half of source is transparent → stays alpha 0 (incl. top-right corner)
    expect((await rgbaAt(out, Math.floor((3 * size) / 4), Math.floor(size / 2)))[3]).toBe(
      0,
    );
    expect((await rgbaAt(out, size - 1, 0))[3]).toBe(0);
  });

  it('renderIcon: fully transparent source + opaque bg → solid fill', async () => {
    const input = await emptyTransparentPng(size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      background: '#ff0000',
    });

    expect(await rgbaAt(out, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(await rgbaAt(out, size / 2, size / 2)).toEqual([255, 0, 0, 255]);
  });

  it('renderIcon: semi-transparent content composites over opaque bg', async () => {
    const input = await alphaPng(0.5, size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      background: '#ffffff',
    });

    const [r, g, b, a] = await rgbaAt(out, size / 2, size / 2);
    // #0080ff @ 0.5 over white ≈ (127, 191, 255)
    expect(a).toBe(255);
    expect(r).toBeGreaterThan(100);
    expect(r).toBeLessThan(140);
    expect(g).toBeGreaterThan(170);
    expect(g).toBeLessThan(210);
    expect(b).toBe(255);
  });

  it('renderIcon: non-square transparent source letterboxes with opaque bg', async () => {
    // Wide strip: opaque blue band, transparent above/below via SVG → PNG
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40">
        <rect x="10" y="5" width="60" height="30" fill="#0000ff"/>
      </svg>`,
    );
    const input = await sharp(svg).png().toBuffer();
    const out = await renderIcon(input, size, {
      ...optionsBase,
      background: '#112233',
    });

    expect(await rgbaAt(out, size / 2, 0)).toEqual([17, 34, 51, 255]);
    expect(await rgbaAt(out, size / 2, size / 2)).toEqual([0, 0, 255, 255]);
  });

  it('renderIcon: opaque bg + cornerRadius still punches corners to alpha 0', async () => {
    const input = await halfTransparentPng(size);
    const out = await renderIcon(input, size, {
      ...optionsBase,
      background: opaqueBg,
      cornerRadius: 100,
    });

    expect((await rgbaAt(out, 0, 0))[3]).toBe(0);
    // Left half of source is opaque red (x < size/2)
    expect(await rgbaAt(out, Math.floor(size / 4), Math.floor(size / 2))).toEqual([
      255,
      0,
      0,
      255,
    ]);
  });

  it('renderOgImage: opaque bg fills transparent regions', async () => {
    const input = await halfTransparentPng(200);
    const out = await renderOgImage(input, {
      ...optionsBase,
      background: opaqueBg,
      padding: 10,
    });

    expect(await rgbaAt(out, 0, 0)).toEqual([0, 255, 0, 255]);
    // Left half of centered content → red
    const [r, g, b, a] = await rgbaAt(out, 400, 315);
    expect([r, g, b, a]).toEqual([255, 0, 0, 255]);
  });

  it('renderOriginal: opaque bg + padding fills transparent pad zone', async () => {
    const input = await halfTransparentPng(100, 50);
    const out = await renderOriginal(input, {
      ...optionsBase,
      background: '#ffffff',
      padding: 20,
    });

    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(50);
    expect(await rgbaAt(out, 0, 0)).toEqual([255, 255, 255, 255]);
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

  it('does not greyscale SVG passthrough (AC10)', () => {
    const source = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#ff0000" width="32" height="32"/></svg>',
      'utf8',
    );

    const text = passthroughFaviconSvg(source).toString('utf8');
    expect(text).toContain('fill="#ff0000"');
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
