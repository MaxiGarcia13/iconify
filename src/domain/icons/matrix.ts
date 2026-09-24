/** Asset filenames, sizes, formats, and presets. Downstream processing must not invent names or dimensions. */

export type PresetId
  = | 'favicon'
    | 'apple'
    | 'android'
    | 'og'
    | 'original'
    | 'all';

export type AssetFormat = 'ico' | 'png' | 'svg';

/** Square icon size in px, or width×height for non-square canvases. */
export type AssetSize
  = | { kind: 'square'; px: number }
    | { kind: 'layers'; px: readonly number[] }
    | { kind: 'rect'; width: number; height: number }
    /** Source metadata width×height. */
    | { kind: 'native' }
    | { kind: 'scalable' };

export interface MatrixEntry {
  /** Path / filename inside the ZIP. */
  name: string;
  size: AssetSize;
  format: AssetFormat;
  contentType: string;
  /** Preset that owns this asset. */
  preset: Exclude<PresetId, 'all'>;
  /** Omit unless the uploaded source is SVG. */
  svgSourceOnly?: boolean;
}

export const ICO_SIZES = [16, 32, 48] as const;

export const PRESET_IDS: readonly PresetId[] = [
  'favicon',
  'apple',
  'android',
  'og',
  'original',
  'all',
] as const;

export const ASSET_MATRIX: readonly MatrixEntry[] = [
  // Modern Web / Favicons
  {
    name: 'favicon.ico',
    size: { kind: 'layers', px: ICO_SIZES },
    format: 'ico',
    contentType: 'image/x-icon',
    preset: 'favicon',
  },
  {
    name: 'favicon-16x16.png',
    size: { kind: 'square', px: 16 },
    format: 'png',
    contentType: 'image/png',
    preset: 'favicon',
  },
  {
    name: 'favicon-32x32.png',
    size: { kind: 'square', px: 32 },
    format: 'png',
    contentType: 'image/png',
    preset: 'favicon',
  },
  {
    name: 'favicon.svg',
    size: { kind: 'scalable' },
    format: 'svg',
    contentType: 'image/svg+xml',
    preset: 'favicon',
    svgSourceOnly: true,
  },
  {
    name: 'safari-pinned-tab.svg',
    size: { kind: 'scalable' },
    format: 'svg',
    contentType: 'image/svg+xml',
    preset: 'favicon',
    svgSourceOnly: true,
  },

  // iOS / Apple Touch
  {
    name: 'apple-touch-icon-152x152.png',
    size: { kind: 'square', px: 152 },
    format: 'png',
    contentType: 'image/png',
    preset: 'apple',
  },
  {
    name: 'apple-touch-icon-167x167.png',
    size: { kind: 'square', px: 167 },
    format: 'png',
    contentType: 'image/png',
    preset: 'apple',
  },
  {
    name: 'apple-touch-icon-180x180.png',
    size: { kind: 'square', px: 180 },
    format: 'png',
    contentType: 'image/png',
    preset: 'apple',
  },
  {
    name: 'apple-touch-icon.png',
    size: { kind: 'square', px: 180 },
    format: 'png',
    contentType: 'image/png',
    preset: 'apple',
  },

  // Android / PWA
  {
    name: 'android-chrome-192x192.png',
    size: { kind: 'square', px: 192 },
    format: 'png',
    contentType: 'image/png',
    preset: 'android',
  },
  {
    name: 'android-chrome-512x512.png',
    size: { kind: 'square', px: 512 },
    format: 'png',
    contentType: 'image/png',
    preset: 'android',
  },

  // Open Graph / Social
  {
    name: 'og-image.png',
    size: { kind: 'rect', width: 1200, height: 630 },
    format: 'png',
    contentType: 'image/png',
    preset: 'og',
  },

  // Original size — ZIP name overridden to upload basename at package time
  {
    name: 'original.png',
    size: { kind: 'native' },
    format: 'png',
    contentType: 'image/png',
    preset: 'original',
  },
] as const;

/**
 * Expand `presets` into concrete matrix rows.
 * `all` expands to platform assets only (not `original`).
 * SVG-only rows are dropped when `sourceIsSvg` is false.
 */
export function resolveMatrix(
  presets: readonly PresetId[],
  sourceIsSvg: boolean,
): MatrixEntry[] {
  const active = new Set<Exclude<PresetId, 'all'>>();

  for (const preset of presets) {
    if (preset === 'all') {
      active.add('favicon');
      active.add('apple');
      active.add('android');
      active.add('og');
    } else {
      active.add(preset);
    }
  }

  return ASSET_MATRIX.filter((entry) => {
    if (entry.svgSourceOnly && !sourceIsSvg)
      return false;
    return active.has(entry.preset);
  });
}

/**
 * ZIP entry name for the original-size asset.
 * Uses the upload basename; falls back to `original.png`; disambiguates collisions.
 */
export function originalZipName(
  uploadFilename: string,
  takenNames: ReadonlySet<string>,
): string {
  const base = sanitizeUploadBasename(uploadFilename);
  if (!takenNames.has(base))
    return base;

  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  let candidate = `${stem}-original${ext}`;
  let n = 2;
  while (takenNames.has(candidate)) {
    candidate = `${stem}-original-${n}${ext}`;
    n += 1;
  }
  return candidate;
}

/** Strip directories / unsafe segments; empty → `original.png`. */
function sanitizeUploadBasename(uploadFilename: string): string {
  const base = uploadFilename
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.trim() ?? '';
  if (!base || base === '.' || base === '..')
    return 'original.png';
  const cleaned = [...base]
    .filter((ch) => ch !== '/' && ch !== '\\' && ch !== '\0')
    .join('');
  return cleaned.length > 0 ? cleaned : 'original.png';
}
