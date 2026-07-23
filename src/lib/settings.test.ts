import { describe, expect, it } from 'vitest';

import { GENERATE_OPTION_DEFAULTS } from './generate-defaults';
import {
  appendSettingsToFormData,
  clampPadding,
  hasAllPreset,
  isPresetChecked,
  normalizeHex6,
  SETTINGS_DEFAULTS,
  toGenerateOptions,
  togglePreset,
} from './settings';

describe('settings defaults', () => {
  it('matches SPEC §3 / §5.3 GenerateRequest defaults', () => {
    expect(toGenerateOptions(SETTINGS_DEFAULTS)).toEqual(GENERATE_OPTION_DEFAULTS);
  });
});

describe('clampPadding', () => {
  it('clamps to 0–50 and rounds', () => {
    expect(clampPadding(-1)).toBe(0);
    expect(clampPadding(0)).toBe(0);
    expect(clampPadding(20.4)).toBe(20);
    expect(clampPadding(20.6)).toBe(21);
    expect(clampPadding(50)).toBe(50);
    expect(clampPadding(99)).toBe(50);
    expect(clampPadding(Number.NaN)).toBe(0);
  });
});

describe('normalizeHex6', () => {
  it('accepts #RRGGBB and RRGGBB', () => {
    expect(normalizeHex6('#AaBbCc')).toBe('#aabbcc');
    expect(normalizeHex6('ff00aa')).toBe('#ff00aa');
  });

  it('rejects invalid values', () => {
    expect(normalizeHex6('#fff')).toBeNull();
    expect(normalizeHex6('transparent')).toBeNull();
    expect(normalizeHex6('#gg0000')).toBeNull();
  });
});

describe('preset checkboxes', () => {
  it('treats all as every preset checked', () => {
    expect(hasAllPreset(['all'])).toBe(true);
    expect(isPresetChecked(['all'], 'favicon')).toBe(true);
    expect(isPresetChecked(['all'], 'og')).toBe(true);
    expect(isPresetChecked(['favicon'], 'apple')).toBe(false);
  });

  it('toggles all on/off', () => {
    expect(togglePreset(['favicon'], 'all', true)).toEqual(['all']);
    expect(togglePreset(['all'], 'all', false)).toEqual(['favicon']);
  });

  it('collapses four individuals to all', () => {
    expect(
      togglePreset(['favicon', 'apple', 'android'], 'og', true),
    ).toEqual(['all']);
  });

  it('keeps at least one preset when unchecking the last', () => {
    expect(togglePreset(['favicon'], 'favicon', false)).toEqual(['apple']);
  });

  it('exits all-mode when unchecking one individual', () => {
    expect(togglePreset(['all'], 'og', false)).toEqual([
      'favicon',
      'apple',
      'android',
    ]);
  });
});

describe('toGenerateOptions / appendSettingsToFormData', () => {
  it('maps transparent background and opaque hex', () => {
    expect(
      toGenerateOptions({
        ...SETTINGS_DEFAULTS,
        transparent: true,
        backgroundHex: '#112233',
      }).background,
    ).toBe('transparent');

    expect(
      toGenerateOptions({
        ...SETTINGS_DEFAULTS,
        transparent: false,
        backgroundHex: '#112233',
      }).background,
    ).toBe('#112233');
  });

  it('appends SPEC §5.5 FormData fields', () => {
    const body = new FormData();
    appendSettingsToFormData(body, {
      ...SETTINGS_DEFAULTS,
      padding: 20,
      transparent: false,
      backgroundHex: '#0a0a0a',
      presets: ['favicon', 'apple'],
    });

    expect(body.get('padding')).toBe('20');
    expect(body.get('background')).toBe('#0a0a0a');
    expect(body.get('presets')).toBe('favicon,apple');
  });
});
