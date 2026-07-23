import { Buffer } from 'node:buffer';

import sharp from 'sharp';

/** Solid PNG for unit tests; defaults to square. */
export async function solidPng(
  width = 64,
  height = width,
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 128, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

/**
 * PNG with alpha: left half opaque `#ff0000`, right half fully transparent.
 * Used for transparent-source + background compositing edge cases (SPEC §4.9).
 */
export async function halfTransparentPng(
  width = 64,
  height = width,
): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 4);
  const mid = Math.floor(width / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw[i] = 255;
      raw[i + 1] = 0;
      raw[i + 2] = 0;
      raw[i + 3] = x < mid ? 255 : 0;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Fully transparent (empty alpha) PNG at the given size. */
export async function emptyTransparentPng(
  width = 64,
  height = width,
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
}

/**
 * Uniform PNG with a chosen alpha (0–1). Default color `#0080ff`.
 */
export async function alphaPng(
  alpha: number,
  width = 64,
  height = width,
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 128, b: 255, alpha },
    },
  })
    .png()
    .toBuffer();
}

/** Minimal valid SVG source for API / packaging tests (AC2). */
export function solidSvg(size = 32): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#0080ff"/></svg>`,
    'utf8',
  );
}
