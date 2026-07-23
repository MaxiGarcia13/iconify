import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { renderOgImage } from './process';

describe('renderOgImage', () => {
  it('returns a 1200×630 PNG (SPEC §2.4 / §4.5)', async () => {
    const input = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

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
