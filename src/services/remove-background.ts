import {
  REMOVE_BACKGROUND_ERROR_FAILED,
  REMOVE_BACKGROUND_ERROR_UNSUPPORTED,
} from '@/domain/remove-background-ui';
import { isRasterSource } from '@/domain/upload-constraints';

export type RemoveBackgroundProgress = (
  key: string,
  current: number,
  total: number,
) => void;

export type RemoveBackgroundResult
  = | { ok: true; file: File }
    | { ok: false; message: string };

/** Minimal surface of `@imgly/background-removal` used by the helper (injectable in tests). */
export type RemoveBackgroundFn = (
  image: Blob | File,
  configuration?: {
    progress?: RemoveBackgroundProgress;
    output?: {
      format?: 'image/png' | 'image/jpeg' | 'image/webp';
      type?: 'foreground' | 'background' | 'mask';
    };
  },
) => Promise<Blob>;

export type RemoveBackgroundLoader = () => Promise<RemoveBackgroundFn>;

let loadCache: Promise<RemoveBackgroundFn> | null = null;
let activeLoader: RemoveBackgroundLoader | null = null;

/** Clears the cached dynamic import (tests only). */
export function resetRemoveBackgroundLoaderCache(): void {
  loadCache = null;
  activeLoader = null;
}

async function importRemoveBackground(): Promise<RemoveBackgroundFn> {
  const { removeBackground } = await import('@imgly/background-removal');
  return removeBackground;
}

/**
 * Resolve the remover, loading `@imgly/background-removal` on first use only.
 */
export function loadRemoveBackground(
  loader: RemoveBackgroundLoader = importRemoveBackground,
): Promise<RemoveBackgroundFn> {
  if (activeLoader !== loader || !loadCache) {
    activeLoader = loader;
    loadCache = loader();
  }
  return loadCache;
}

/**
 * PNG filename for a cutout source.
 * Preserves the upload stem and always uses `.png` (e.g. `logo.jpg` → `logo.png`).
 */
export function cutoutPngFilename(uploadFilename: string): string {
  const base = uploadFilename
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.trim() ?? '';

  if (!base || base === '.' || base === '..')
    return 'cutout.png';

  const cleaned = [...base]
    .filter((ch) => ch !== '/' && ch !== '\\' && ch !== '\0')
    .join('');
  if (!cleaned)
    return 'cutout.png';

  const dot = cleaned.lastIndexOf('.');
  const stem = (dot > 0 ? cleaned.slice(0, dot) : cleaned).trim();
  return `${stem.length > 0 ? stem : 'cutout'}.png`;
}

/**
 * Client-side background removal.
 * Returns a PNG `File` with alpha; does not mutate or clear the input on failure.
 * The library is loaded via dynamic `import` on first use (not at island boot).
 */
export async function removeBackgroundFromSource(
  file: File,
  options: {
    removeBackground?: RemoveBackgroundFn;
    loader?: RemoveBackgroundLoader;
    onProgress?: RemoveBackgroundProgress;
  } = {},
): Promise<RemoveBackgroundResult> {
  if (!isRasterSource(file)) {
    return {
      ok: false,
      message: REMOVE_BACKGROUND_ERROR_UNSUPPORTED,
    };
  }

  const remove
    = options.removeBackground
      ?? (await loadRemoveBackground(options.loader));

  let blob: Blob;
  try {
    blob = await remove(file, {
      progress: options.onProgress,
      output: { format: 'image/png', type: 'foreground' },
    });
  } catch {
    return { ok: false, message: REMOVE_BACKGROUND_ERROR_FAILED };
  }

  if (!blob || blob.size === 0) {
    return { ok: false, message: REMOVE_BACKGROUND_ERROR_FAILED };
  }

  return {
    ok: true,
    file: new File([blob], cutoutPngFilename(file.name), {
      type: 'image/png',
      lastModified: Date.now(),
    }),
  };
}
