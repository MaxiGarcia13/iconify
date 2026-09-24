import type { RemoveBackgroundFn } from '@/services/remove-background';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  cutoutPngFilename,
  loadRemoveBackground,
  removeBackgroundFromSource,
  resetRemoveBackgroundLoaderCache,
} from '@/services/remove-background';

function rasterFile(name: string, type: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

afterEach(() => {
  resetRemoveBackgroundLoaderCache();
});

describe('cutoutPngFilename', () => {
  it('preserves stem and forces .png', () => {
    expect(cutoutPngFilename('logo.jpg')).toBe('logo.png');
    expect(cutoutPngFilename('logo.JPEG')).toBe('logo.png');
    expect(cutoutPngFilename('logo.png')).toBe('logo.png');
    expect(cutoutPngFilename('Brand/Icon.JPG')).toBe('Icon.png');
  });

  it('falls back when basename is empty or unsafe', () => {
    expect(cutoutPngFilename('')).toBe('cutout.png');
    expect(cutoutPngFilename('.')).toBe('cutout.png');
    expect(cutoutPngFilename('..')).toBe('cutout.png');
  });
});

describe('loadRemoveBackground', () => {
  it('invokes the loader only once for the same loader', async () => {
    const remover = vi.fn<RemoveBackgroundFn>(async () =>
      new Blob([new Uint8Array([1])], { type: 'image/png' }),
    );
    const loader = vi.fn(async () => remover);

    const a = await loadRemoveBackground(loader);
    const b = await loadRemoveBackground(loader);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(a).toBe(remover);
    expect(b).toBe(remover);
  });
});

describe('removeBackgroundFromSource', () => {
  it('rejects SVG without calling the remover', async () => {
    const removeBackground = vi.fn<RemoveBackgroundFn>();
    const result = await removeBackgroundFromSource(
      rasterFile('mark.svg', 'image/svg+xml'),
      { removeBackground },
    );

    expect(result).toEqual({
      ok: false,
      message: 'Background removal is only available for PNG and JPG.',
    });
    expect(removeBackground).not.toHaveBeenCalled();
  });

  it('returns a PNG File with cutout basename on success', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 0, 0]);
    const removeBackground = vi.fn<RemoveBackgroundFn>(async () =>
      new Blob([pngBytes], { type: 'image/png' }),
    );

    const source = rasterFile('photo.jpg', 'image/jpeg');
    const result = await removeBackgroundFromSource(source, {
      removeBackground,
    });

    expect(removeBackground).toHaveBeenCalledWith(
      source,
      expect.objectContaining({
        output: { format: 'image/png', type: 'foreground' },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok)
      return;
    expect(result.file.name).toBe('photo.png');
    expect(result.file.type).toBe('image/png');
    expect(await result.file.arrayBuffer()).toEqual(pngBytes.buffer);
  });

  it('maps remover failures to an error and does not invent a file', async () => {
    const removeBackground = vi.fn<RemoveBackgroundFn>(async () => {
      throw new Error('model failed');
    });

    const result = await removeBackgroundFromSource(
      rasterFile('logo.png', 'image/png'),
      { removeBackground },
    );

    expect(result.ok).toBe(false);
    if (result.ok)
      return;
    expect(result.message).toMatch(/failed/i);
  });

  it('forwards onProgress to the remover config', async () => {
    const onProgress = vi.fn();
    const removeBackground = vi.fn<RemoveBackgroundFn>(async (_image, config) => {
      config?.progress?.('compute:inference', 1, 4);
      return new Blob([new Uint8Array([1])], { type: 'image/png' });
    });

    await removeBackgroundFromSource(rasterFile('a.png', 'image/png'), {
      removeBackground,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith('compute:inference', 1, 4);
  });

  it('lazy-loads via loader only when no remover is injected', async () => {
    const remover = vi.fn<RemoveBackgroundFn>(async () =>
      new Blob([new Uint8Array([1])], { type: 'image/png' }),
    );
    const loader = vi.fn(async () => remover);

    await removeBackgroundFromSource(rasterFile('a.png', 'image/png'), { loader });
    await removeBackgroundFromSource(rasterFile('b.png', 'image/png'), { loader });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(remover).toHaveBeenCalledTimes(2);
  });
});
