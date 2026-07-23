import type { GenerateOptions } from './icons/types';

/** Option defaults from SPEC §3 `GenerateRequest`. Safe for client + server. */
export const GENERATE_OPTION_DEFAULTS: GenerateOptions = {
  background: 'transparent',
  padding: 0,
  cornerRadius: 0,
  monochrome: false,
  presets: ['all', 'original'],
};
