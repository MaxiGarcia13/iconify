import type { Buffer } from 'node:buffer';

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
