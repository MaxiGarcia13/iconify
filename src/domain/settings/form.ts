import type { GenerateOptions } from '../icons/types';
import type { SettingsState } from './types';

import { clampCornerRadius, clampPadding } from './fields';

export function toGenerateOptions(state: SettingsState): GenerateOptions {
  return {
    padding: clampPadding(state.padding),
    cornerRadius: clampCornerRadius(state.cornerRadius),
    background: state.transparent ? 'transparent' : state.backgroundHex,
    monochrome: state.monochrome,
    presets: state.presets.length > 0 ? [...state.presets] : ['all', 'original'],
  };
}

/** Visual fields only (SPEC §3.3 preview). Does not set `presets`. */
export function appendVisualSettingsToFormData(
  body: FormData,
  state: SettingsState,
): void {
  const options = toGenerateOptions(state);
  body.set('padding', String(options.padding));
  body.set('cornerRadius', String(options.cornerRadius));
  body.set('monochrome', options.monochrome ? 'true' : 'false');
  body.set('background', options.background);
}

export function appendSettingsToFormData(
  body: FormData,
  state: SettingsState,
): void {
  appendVisualSettingsToFormData(body, state);
  const options = toGenerateOptions(state);
  body.set('presets', options.presets.join(','));
}

/**
 * Stable key of visual settings that affect preview (SPEC §5.3.1).
 * Omits `presets` so ZIP membership toggles do not re-fetch.
 */
export function visualPreviewKey(state: SettingsState): string {
  const options = toGenerateOptions(state);
  return [
    options.padding,
    options.cornerRadius,
    options.monochrome ? '1' : '0',
    options.background,
  ].join('|');
}
