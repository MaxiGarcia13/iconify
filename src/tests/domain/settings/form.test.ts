import { describe, expect, it } from 'vitest';

import { GENERATE_OPTION_DEFAULTS } from '@/domain/generate-defaults';
import {
  appendSettingsToFormData,
  isPresetChecked,
  SETTINGS_DEFAULTS,
  toGenerateOptions,
} from '@/domain/settings';

describe('settings defaults', () => {
  it('matches SPEC §3 / §5.3 GenerateRequest defaults', () => {
    expect(toGenerateOptions(SETTINGS_DEFAULTS)).toEqual(GENERATE_OPTION_DEFAULTS);
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
