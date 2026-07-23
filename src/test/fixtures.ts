import { Buffer } from 'node:buffer';

import sharp from 'sharp';

/** Solid square PNG for unit tests (sizes / packaging / API). */
export async function solidPng(size = 64): Promise<Buffer> {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 128, b: 255, alpha: 1 },
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
