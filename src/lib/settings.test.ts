import { describe, expect, it } from 'vitest';

import { GENERATE_OPTION_DEFAULTS } from './generate-defaults';
import {
  appendSettingsToFormData,
  clampCornerRadius,
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

describe('clampPadding / clampCornerRadius', () => {
  it('clampPadding clamps to 0–50 and rounds', () => {
    expect(clampPadding(-1)).toBe(0);
    expect(clampPadding(0)).toBe(0);
    expect(clampPadding(20.4)).toBe(20);
    expect(clampPadding(20.6)).toBe(21);
    expect(clampPadding(50)).toBe(50);
    expect(clampPadding(99)).toBe(50);
    expect(clampPadding(Number.NaN)).toBe(0);
  });

  it('clampCornerRadius clamps to 0–100 and rounds', () => {
    expect(clampCornerRadius(-1)).toBe(0);
    expect(clampCornerRadius(0)).toBe(0);
    expect(clampCornerRadius(50.4)).toBe(50);
    expect(clampCornerRadius(50.6)).toBe(51);
    expect(clampCornerRadius(100)).toBe(100);
    expect(clampCornerRadius(150)).toBe(100);
    expect(clampCornerRadius(Number.NaN)).toBe(0);
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
  it('treats all as every platform preset checked (not original)', () => {
    expect(hasAllPreset(['all'])).toBe(true);
    expect(isPresetChecked(['all'], 'favicon')).toBe(true);
    expect(isPresetChecked(['all'], 'og')).toBe(true);
    expect(isPresetChecked(['all'], 'original')).toBe(false);
    expect(isPresetChecked(['favicon'], 'apple')).toBe(false);
    expect(isPresetChecked(['all', 'original'], 'original')).toBe(true);
  });

  it('toggles all on/off', () => {
    expect(togglePreset(['favicon'], 'all', true)).toEqual(['all']);
    expect(togglePreset(['all'], 'all', false)).toEqual(['favicon']);
  });

  it('preserves original when collapsing platform presets to all', () => {
    expect(
      togglePreset(['favicon', 'apple', 'android', 'original'], 'og', true),
    ).toEqual(['all', 'original']);
  });

  it('preserves original when exiting all-mode', () => {
    expect(togglePreset(['all', 'original'], 'og', false)).toEqual([
      'favicon',
      'apple',
      'android',
      'original',
    ]);
  });

  it('toggles original independently of all (AC11)', () => {
    expect(togglePreset(['all'], 'original', true)).toEqual([
      'all',
      'original',
    ]);
    expect(togglePreset(['all', 'original'], 'original', false)).toEqual([
      'all',
    ]);
    expect(togglePreset(['favicon'], 'original', true)).toEqual([
      'favicon',
      'original',
    ]);
    expect(togglePreset(['original'], 'original', false)).toEqual(['all']);
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

  it('maps cornerRadius into GenerateOptions and FormData (SPEC §5.5)', () => {
    const options = toGenerateOptions({
      ...SETTINGS_DEFAULTS,
      cornerRadius: 75,
    });
    expect(options.cornerRadius).toBe(75);

    const clamped = toGenerateOptions({
      ...SETTINGS_DEFAULTS,
      cornerRadius: 150,
    });
    expect(clamped.cornerRadius).toBe(100);

    const body = new FormData();
    appendSettingsToFormData(body, {
      ...SETTINGS_DEFAULTS,
      cornerRadius: 88,
    });
    expect(body.get('cornerRadius')).toBe('88');
  });

  it('maps monochrome into GenerateOptions and FormData (SPEC §5.5)', () => {
    expect(
      toGenerateOptions({
        ...SETTINGS_DEFAULTS,
        monochrome: true,
      }).monochrome,
    ).toBe(true);

    expect(
      toGenerateOptions({
        ...SETTINGS_DEFAULTS,
        monochrome: false,
      }).monochrome,
    ).toBe(false);

    const on = new FormData();
    appendSettingsToFormData(on, {
      ...SETTINGS_DEFAULTS,
      monochrome: true,
    });
    expect(on.get('monochrome')).toBe('true');

    const off = new FormData();
    appendSettingsToFormData(off, {
      ...SETTINGS_DEFAULTS,
      monochrome: false,
    });
    expect(off.get('monochrome')).toBe('false');
  });

  it('appends SPEC §5.5 FormData fields', () => {
    const body = new FormData();
    appendSettingsToFormData(body, {
      ...SETTINGS_DEFAULTS,
      padding: 20,
      cornerRadius: 35,
      monochrome: true,
      transparent: false,
      backgroundHex: '#0a0a0a',
      presets: ['favicon', 'apple'],
    });

    expect(body.get('padding')).toBe('20');
    expect(body.get('cornerRadius')).toBe('35');
    expect(body.get('monochrome')).toBe('true');
    expect(body.get('background')).toBe('#0a0a0a');
    expect(body.get('presets')).toBe('favicon,apple');
  });

  it('maps original preset into FormData (SPEC §5.5 / AC11)', () => {
    const alone = new FormData();
    appendSettingsToFormData(alone, {
      ...SETTINGS_DEFAULTS,
      presets: ['original'],
    });
    expect(alone.get('presets')).toBe('original');

    const combined = new FormData();
    appendSettingsToFormData(combined, {
      ...SETTINGS_DEFAULTS,
      presets: ['all', 'original'],
    });
    expect(combined.get('presets')).toBe('all,original');
  });

  it('defaults include original selected with all', () => {
    expect(SETTINGS_DEFAULTS.presets).toEqual(['all', 'original']);
    expect(isPresetChecked(SETTINGS_DEFAULTS.presets, 'original')).toBe(true);
    expect(isPresetChecked(SETTINGS_DEFAULTS.presets, 'favicon')).toBe(true);
  });
});
