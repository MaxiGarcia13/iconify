import type { Buffer } from 'node:buffer';

import type { GenerateOptions } from './types';

import toIco from 'to-ico';

import { ICO_SIZES } from './matrix';
import { renderIcon } from './process';

export async function buildFaviconIco(
  input: Buffer,
  options: Pick<
    GenerateOptions,
    'background' | 'padding' | 'cornerRadius' | 'monochrome'
  >,
): Promise<Buffer> {
  const layers = await Promise.all(
    ICO_SIZES.map((size) => renderIcon(input, size, options)),
  );
  return toIco(layers);
}
