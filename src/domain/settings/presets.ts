import type { PresetId } from '../icons/types';
import type { PlatformPreset } from './types';

import { PLATFORM_PRESETS } from './types';

export function hasAllPreset(presets: readonly PresetId[]): boolean {
  return presets.includes('all');
}

export function hasOriginalPreset(presets: readonly PresetId[]): boolean {
  return presets.includes('original');
}

export function isPresetChecked(
  presets: readonly PresetId[],
  id: PresetId,
): boolean {
  // `original` is opt-in and never implied by `all`.
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
