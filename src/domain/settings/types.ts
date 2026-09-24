import type { PresetId } from '../icons/types';

import { GENERATE_OPTION_DEFAULTS } from '../generate-defaults';

/** Platform presets that collapse into `all`. Does not include opt-in `original`. */
export const PLATFORM_PRESETS = [
  'favicon',
  'apple',
  'android',
  'og',
] as const satisfies readonly Exclude<PresetId, 'all' | 'original'>[];

export type PlatformPreset = (typeof PLATFORM_PRESETS)[number];

export const SELECTABLE_PRESETS = [
  ...PLATFORM_PRESETS,
  'original',
] as const satisfies readonly Exclude<PresetId, 'all'>[];

export type SelectablePreset = (typeof SELECTABLE_PRESETS)[number];

/** `transparent` + `backgroundHex` map to API `background` (`transparent` | `#RRGGBB`). */
export interface SettingsState {
  padding: number;
  cornerRadius: number;
  monochrome: boolean;
  transparent: boolean;
  /** Last opaque pad fill; used when `transparent` is off. */
  backgroundHex: `#${string}`;
  presets: PresetId[];
}

export const SETTINGS_DEFAULTS: SettingsState = {
  padding: GENERATE_OPTION_DEFAULTS.padding,
  cornerRadius: GENERATE_OPTION_DEFAULTS.cornerRadius,
  monochrome: GENERATE_OPTION_DEFAULTS.monochrome,
  transparent: GENERATE_OPTION_DEFAULTS.background === 'transparent',
  backgroundHex: '#ffffff',
  presets: [...GENERATE_OPTION_DEFAULTS.presets],
};
