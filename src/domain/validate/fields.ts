import type { GenerateOptions, PresetId } from '../icons/types';

import { PRESET_IDS } from '../icons/matrix';

const HEX_BG = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function stringField(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (value === null)
    return null;
  if (typeof value !== 'string')
    return null;
  return value;
}

/** Comma-separated or repeated `presets` fields. */
export function presetsField(form: FormData): string | null {
  const values = form
    .getAll('presets')
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  if (values.length === 0)
    return null;
  return values.join(',');
}

export function parseBackground(
  value: string,
): GenerateOptions['background'] | null {
  if (value === 'transparent')
    return 'transparent';
  if (HEX_BG.test(value))
    return value as `#${string}`;
  return null;
}

/** Multipart literals `true` / `false` only. */
export function parseMonochrome(value: string): boolean | null {
  if (value === 'true')
    return true;
  if (value === 'false')
    return false;
  return null;
}

export function parsePresets(raw: string): PresetId[] | null {
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0)
    return null;

  const allowed = new Set<string>(PRESET_IDS);
  const presets: PresetId[] = [];

  for (const part of parts) {
    if (!allowed.has(part))
      return null;
    presets.push(part as PresetId);
  }

  return presets;
}
