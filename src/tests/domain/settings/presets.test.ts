import { describe, expect, it } from 'vitest';

import {
  hasAllPreset,
  isPresetChecked,
  SETTINGS_DEFAULTS,
  togglePreset,
} from '@/domain/settings';

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

  it('defaults include original selected with all', () => {
    expect(SETTINGS_DEFAULTS.presets).toEqual(['all', 'original']);
    expect(isPresetChecked(SETTINGS_DEFAULTS.presets, 'original')).toBe(true);
    expect(isPresetChecked(SETTINGS_DEFAULTS.presets, 'favicon')).toBe(true);
  });
});
