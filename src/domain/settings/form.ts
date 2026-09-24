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
