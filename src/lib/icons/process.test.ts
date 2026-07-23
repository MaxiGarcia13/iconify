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
      });

      const meta = await sharp(out).metadata();
      expect(meta.format).toBe('png');
      expect(meta.width).toBe(px);
      expect(meta.height).toBe(px);
    },
  );
});

describe('renderOgImage', () => {
  it('returns a 1200×630 PNG for og-image.png (SPEC §2.4 / §4.5)', async () => {
    const input = await solidPng(200);
    const out = await renderOgImage(input, {
      background: 'transparent',
      padding: 10,
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
