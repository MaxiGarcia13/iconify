import type { GenerateOptions, PresetId } from './icons/types';

import { GENERATE_OPTION_DEFAULTS } from './generate-defaults';

/** Individual preset checkboxes (excludes `all`) — SPEC §2.5 / §5.3. */
export const SELECTABLE_PRESETS = [
  'favicon',
  'apple',
  'android',
  'og',
] as const satisfies readonly Exclude<PresetId, 'all'>[];

export type SelectablePreset = (typeof SELECTABLE_PRESETS)[number];

/**
 * Client settings state — SPEC §5.3.
 * `transparent` + `backgroundHex` map to API `background` (`transparent` | `#RRGGBB`).
 */
export interface SettingsState {
  padding: number;
  transparent: boolean;
  /** Last opaque pad fill; used when `transparent` is off. */
  backgroundHex: `#${string}`;
  presets: PresetId[];
}

export const SETTINGS_DEFAULTS: SettingsState = {
  padding: GENERATE_OPTION_DEFAULTS.padding,
  transparent: GENERATE_OPTION_DEFAULTS.background === 'transparent',
  backgroundHex: '#ffffff',
  presets: [...GENERATE_OPTION_DEFAULTS.presets],
};

const HEX6 = /^#?[0-9a-f]{6}$/i;

/** Clamp padding to SPEC §3 / §5.3 range (0–50, step 1). */
export function clampPadding(value: number): number {
  if (!Number.isFinite(value))
    return 0;
  return Math.min(50, Math.max(0, Math.round(value)));
}

/** Normalize user hex input to `#rrggbb`, or `null` if invalid. */
export function normalizeHex6(raw: string): `#${string}` | null {
  const trimmed = raw.trim();
  if (!HEX6.test(trimmed))
    return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return withHash.toLowerCase() as `#${string}`;
}

export function hasAllPreset(presets: readonly PresetId[]): boolean {
  return presets.includes('all');
}

/** Whether a preset checkbox should appear checked. */
export function isPresetChecked(
  presets: readonly PresetId[],
  id: PresetId,
): boolean {
  if (hasAllPreset(presets))
    return true;
  return presets.includes(id);
}

/**
 * Toggle a preset checkbox. `all` collapses to `['all']`;
 * unchecking `all` leaves a single preset (`favicon`).
 * Selecting every individual preset also collapses to `['all']`.
 * Always keeps at least one preset selected.
 */
export function togglePreset(
  presets: readonly PresetId[],
  id: PresetId,
  checked: boolean,
): PresetId[] {
  if (id === 'all') {
    return checked ? ['all'] : ['favicon'];
  }

  const current: SelectablePreset[] = hasAllPreset(presets)
    ? [...SELECTABLE_PRESETS]
    : SELECTABLE_PRESETS.filter((p) => presets.includes(p));

  let next: SelectablePreset[];
  if (checked) {
    next = current.includes(id) ? current : [...current, id];
  } else {
    next = current.filter((p) => p !== id);
    if (next.length === 0)
      next = [id === 'favicon' ? 'apple' : 'favicon'];
  }

  if (SELECTABLE_PRESETS.every((p) => next.includes(p)))
    return ['all'];

  return next;
}

/** Map UI state → API `GenerateOptions` — SPEC §4.2 / §5.5. */
export function toGenerateOptions(state: SettingsState): GenerateOptions {
  return {
    padding: clampPadding(state.padding),
    background: state.transparent ? 'transparent' : state.backgroundHex,
    presets: state.presets.length > 0 ? [...state.presets] : ['all'],
  };
}

/** Append settings fields to `FormData` for `POST /api/v1/generate` — SPEC §5.5. */
export function appendSettingsToFormData(
  body: FormData,
  state: SettingsState,
): void {
  const options = toGenerateOptions(state);
  body.set('padding', String(options.padding));
  body.set('background', options.background);
  body.set('presets', options.presets.join(','));
}
