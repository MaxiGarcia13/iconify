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

const DEFAULT_ERROR = 'Background removal failed. Try again with a different image.';

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

async function loadRemoveBackground(): Promise<RemoveBackgroundFn> {
  const { removeBackground } = await import('@imgly/background-removal');
  return removeBackground;
}

/**
 * Client-side background removal.
 * Returns a PNG `File` with alpha; does not mutate or clear the input on failure.
 */
export async function removeBackgroundFromSource(
  file: File,
  options: {
    removeBackground?: RemoveBackgroundFn;
    onProgress?: RemoveBackgroundProgress;
  } = {},
): Promise<RemoveBackgroundResult> {
  if (!isRasterSource(file)) {
    return {
      ok: false,
      message: 'Background removal is only available for PNG and JPG.',
    };
  }

  const remove
    = options.removeBackground ?? (await loadRemoveBackground());

  let blob: Blob;
  try {
    blob = await remove(file, {
      progress: options.onProgress,
      output: { format: 'image/png', type: 'foreground' },
    });
  } catch {
    return { ok: false, message: DEFAULT_ERROR };
  }

  if (!blob || blob.size === 0) {
    return { ok: false, message: DEFAULT_ERROR };
  }

  return {
    ok: true,
    file: new File([blob], cutoutPngFilename(file.name), {
      type: 'image/png',
      lastModified: Date.now(),
    }),
  };
}
