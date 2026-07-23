import type { Buffer } from 'node:buffer';

import type { GenerateOptions } from './types';

import toIco from 'to-ico';

import { ICO_SIZES } from './matrix';
import { renderIcon } from './process';

/**
 * Build a multi-resolution `favicon.ico` with 16 / 32 / 48 px layers.
 * SPEC §4.4 / AC5.
 */
export async function buildFaviconIco(
  input: Buffer,
  options: Pick<GenerateOptions, 'background' | 'padding' | 'cornerRadius'>,
): Promise<Buffer> {
  const layers = await Promise.all(
    ICO_SIZES.map((size) => renderIcon(input, size, options)),
  );
  return toIco(layers);
}
