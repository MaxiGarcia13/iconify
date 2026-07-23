import type { GenerateOptions, PresetId } from './icons/types';

import { GENERATE_OPTION_DEFAULTS } from './generate-defaults';

/**
 * Platform presets that collapse into `all` — SPEC §2.6.
 * Does **not** include opt-in `original`.
 */
export const PLATFORM_PRESETS = [
  'favicon',
  'apple',
  'android',
  'og',
] as const satisfies readonly Exclude<PresetId, 'all' | 'original'>[];

export type PlatformPreset = (typeof PLATFORM_PRESETS)[number];

/** Individual preset checkboxes (excludes `all`) — SPEC §2.5 / §5.3. */
export const SELECTABLE_PRESETS = [
  ...PLATFORM_PRESETS,
  'original',
] as const satisfies readonly Exclude<PresetId, 'all'>[];

export type SelectablePreset = (typeof SELECTABLE_PRESETS)[number];

/**
 * Client settings state — SPEC §5.3.
 * `transparent` + `backgroundHex` map to API `background` (`transparent` | `#RRGGBB`).
 */
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

const HEX6 = /^#?[0-9a-f]{6}$/i;

/** Clamp 0–50 percent controls (padding) — SPEC §3 / §5.3. */
function clampPercent0to50(value: number): number {
  if (!Number.isFinite(value))
    return 0;
  return Math.min(50, Math.max(0, Math.round(value)));
}

/** Clamp 0–100 percent controls (corner radius) — SPEC §3 / §5.3. */
function clampPercent0to100(value: number): number {
  if (!Number.isFinite(value))
    return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Clamp padding to SPEC §3 / §5.3 range (0–50, step 1). */
export function clampPadding(value: number): number {
  return clampPercent0to50(value);
}

/** Clamp corner radius to SPEC §3 / §5.3 range (0–100, step 1). */
export function clampCornerRadius(value: number): number {
  return clampPercent0to100(value);
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

export function hasOriginalPreset(presets: readonly PresetId[]): boolean {
  return presets.includes('original');
}

/** Whether a preset checkbox should appear checked. */
export function isPresetChecked(
  presets: readonly PresetId[],
  id: PresetId,
): boolean {
  // `original` is opt-in and never implied by `all` (SPEC §2.6 / AC11).
  if (id === 'original')
    return hasOriginalPreset(presets);
  if (hasAllPreset(presets))
    return true;
  return presets.includes(id);
}

/**
 * Toggle a preset checkbox. Platform presets collapse to `['all']`;
 * unchecking `all` leaves a single platform preset (`favicon`).
 * Selecting every platform preset also collapses to `['all']`.
 * `original` is independent of `all` and may combine with any set.
 * Always keeps at least one preset selected.
 */
export function togglePreset(
  presets: readonly PresetId[],
  id: PresetId,
  checked: boolean,
): PresetId[] {
  const withOriginal = hasOriginalPreset(presets);

  if (id === 'original') {
    if (checked) {
      if (withOriginal)
        return [...presets];
      const rest = presets.filter((p) => p !== 'original');
      return rest.length > 0 ? [...rest, 'original'] : ['original'];
    }
    const next = presets.filter((p) => p !== 'original');
    return next.length > 0 ? next : ['all'];
  }

  if (id === 'all') {
    if (checked)
      return withOriginal ? ['all', 'original'] : ['all'];
    return withOriginal ? ['favicon', 'original'] : ['favicon'];
  }

  if (!isPlatformPreset(id))
    return [...presets];

  const current: PlatformPreset[] = hasAllPreset(presets)
    ? [...PLATFORM_PRESETS]
    : PLATFORM_PRESETS.filter((p) => presets.includes(p));

  let next: PlatformPreset[];
  if (checked) {
    next = current.includes(id) ? current : [...current, id];
  } else {
    next = current.filter((p) => p !== id);
    if (next.length === 0)
      next = [id === 'favicon' ? 'apple' : 'favicon'];
  }

  if (PLATFORM_PRESETS.every((p) => next.includes(p)))
    return withOriginal ? ['all', 'original'] : ['all'];

  return withOriginal ? [...next, 'original'] : next;
}

function isPlatformPreset(id: PresetId): id is PlatformPreset {
  return (PLATFORM_PRESETS as readonly string[]).includes(id);
}

/** Map UI state → API `GenerateOptions` — SPEC §4.2 / §5.5. */
export function toGenerateOptions(state: SettingsState): GenerateOptions {
  return {
    padding: clampPadding(state.padding),
    cornerRadius: clampCornerRadius(state.cornerRadius),
    background: state.transparent ? 'transparent' : state.backgroundHex,
    monochrome: state.monochrome,
    presets: state.presets.length > 0 ? [...state.presets] : ['all', 'original'],
  };
}

/** Append settings fields to `FormData` for `POST /api/v1/generate` — SPEC §5.5. */
export function appendSettingsToFormData(
  body: FormData,
  state: SettingsState,
): void {
  const options = toGenerateOptions(state);
  body.set('padding', String(options.padding));
  body.set('cornerRadius', String(options.cornerRadius));
  body.set('monochrome', options.monochrome ? 'true' : 'false');
  body.set('background', options.background);
  body.set('presets', options.presets.join(','));
}
