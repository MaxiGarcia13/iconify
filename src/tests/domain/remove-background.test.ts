import type { RemoveBackgroundFn, RemoveBackgroundResult } from '@/services/remove-background';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DropzoneClearBar } from '@/components/dropzone/dropzone-clear-bar';
import { SettingsPanel } from '@/components/settings-panel';
import {
  applyRemoveBackgroundResult,
  isRemoveBackgroundDisabled,
  REMOVE_BACKGROUND_BUTTON_LABEL,
  undoRemoveBackground,
} from '@/domain/remove-background-ui';
import {
  appendSettingsToFormData,
  appendVisualSettingsToFormData,
  SETTINGS_DEFAULTS,
} from '@/domain/settings';
import {
  cutoutPngFilename,
  removeBackgroundFromSource,
} from '@/services/remove-background';
import { createRemoveBackgroundRunner } from '@/services/remove-background-runner';

function raster(name: string, type: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('remove background acceptance', () => {
  it('helper produces a PNG File with cutout basename', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 0, 0]);
    const removeBackground: RemoveBackgroundFn = async () =>
      new Blob([pngBytes], { type: 'image/png' });

    const result = await removeBackgroundFromSource(
      raster('Brand/Icon.JPG', 'image/jpeg'),
      { removeBackground },
    );

    expect(cutoutPngFilename('Brand/Icon.JPG')).toBe('Icon.png');
    expect(result.ok).toBe(true);
    if (!result.ok)
      return;
    expect(result.file.type).toBe('image/png');
    expect(result.file.name).toBe('Icon.png');
    expect(await result.file.arrayBuffer()).toEqual(pngBytes.buffer);
  });

  it('rejects SVG and disables the action for SVG sources', async () => {
    const removeBackground = async () => {
      throw new Error('should not run');
    };
    const svg = raster('mark.svg', 'image/svg+xml');

    expect(await removeBackgroundFromSource(svg, { removeBackground }))
      .toEqual({
        ok: false,
        message: 'Background removal is only available for PNG and JPG.',
      });
    expect(isRemoveBackgroundDisabled({ file: svg })).toBe(true);
  });

  it('undo restores the prior file', () => {
    const original = raster('logo.jpg', 'image/jpeg');
    const cutout = raster('logo.png', 'image/png');
    const after = applyRemoveBackgroundResult(original, {
      ok: true,
      file: cutout,
    });
    expect(undoRemoveBackground(after)).toEqual({
      file: original,
      error: null,
      undoFile: null,
    });
  });

  it('pending cancel does not apply a stale result', async () => {
    const results: RemoveBackgroundResult[] = [];
    let release!: (result: RemoveBackgroundResult) => void;
    const gate = new Promise<RemoveBackgroundResult>((resolve) => {
      release = resolve;
    });

    const runner = createRemoveBackgroundRunner(
      {
        onPending: () => {},
        onResult: (result) => results.push(result),
      },
      { removeBackgroundFromSourceFn: async () => gate },
    );

    const runPromise = runner.run(raster('a.png', 'image/png'));
    runner.cancel();
    release({
      ok: true,
      file: raster('stale.png', 'image/png'),
    });
    await runPromise;

    expect(results).toEqual([]);
  });

  it('exposes Remove background on the dropzone bar, not in Settings', () => {
    const bar = renderToStaticMarkup(
      createElement(DropzoneClearBar, {
        fileName: 'logo.png',
        disabled: false,
        onClear: () => {},
        onRemoveBackground: () => {},
      }),
    );
    const settings = renderToStaticMarkup(createElement(SettingsPanel));

    expect(bar).toContain(REMOVE_BACKGROUND_BUTTON_LABEL);
    expect(settings).not.toContain(REMOVE_BACKGROUND_BUTTON_LABEL);
  });

  it('does not send a removeBackground field on generate or preview FormData', () => {
    const generate = new FormData();
    appendSettingsToFormData(generate, SETTINGS_DEFAULTS);
    const preview = new FormData();
    appendVisualSettingsToFormData(preview, SETTINGS_DEFAULTS);

    expect(generate.get('removeBackground')).toBeNull();
    expect(preview.get('removeBackground')).toBeNull();
    expect([...generate.keys()]).not.toContain('removeBackground');
    expect([...preview.keys()]).not.toContain('removeBackground');
  });

  it('keeps the prior file when removal fails', () => {
    const previous = raster('logo.jpg', 'image/jpeg');
    const applied = applyRemoveBackgroundResult(previous, {
      ok: false,
      message: 'Background removal failed. Try again with a different image.',
    });
    expect(applied.file).toBe(previous);
    expect(applied.error).toBeTruthy();
  });
});
