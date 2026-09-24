import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_DEFAULTS, visualPreviewKey } from '@/domain/settings';
import {
  createLivePreviewController,
  PREVIEW_DEBOUNCE_MS,
} from '@/services/live-preview';
import type { PreviewResult } from '@/services/preview';

function pngFile(name = 'logo.png'): File {
  return new File([new Uint8Array([137, 80, 78, 71])], name, {
    type: 'image/png',
  });
}

describe('visualPreviewKey', () => {
  it('ignores presets so ZIP toggles do not re-fetch (SPEC §5.3.1)', () => {
    const base = visualPreviewKey(SETTINGS_DEFAULTS);
    expect(
      visualPreviewKey({
        ...SETTINGS_DEFAULTS,
        presets: ['favicon'],
      }),
    ).toBe(base);
    expect(
      visualPreviewKey({
        ...SETTINGS_DEFAULTS,
        presets: ['apple', 'original'],
      }),
    ).toBe(base);
  });

  it('changes when visual options change', () => {
    expect(
      visualPreviewKey({ ...SETTINGS_DEFAULTS, padding: 10 }),
    ).not.toBe(visualPreviewKey(SETTINGS_DEFAULTS));
    expect(
      visualPreviewKey({ ...SETTINGS_DEFAULTS, cornerRadius: 50 }),
    ).not.toBe(visualPreviewKey(SETTINGS_DEFAULTS));
    expect(
      visualPreviewKey({ ...SETTINGS_DEFAULTS, monochrome: true }),
    ).not.toBe(visualPreviewKey(SETTINGS_DEFAULTS));
    expect(
      visualPreviewKey({
        ...SETTINGS_DEFAULTS,
        transparent: false,
        backgroundHex: '#ff0000',
      }),
    ).not.toBe(visualPreviewKey(SETTINGS_DEFAULTS));
  });
});

describe('createLivePreviewController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function setup() {
    const urls: Array<string | null> = [];
    const errors: Array<string | null> = [];
    const postPreviewFn = vi.fn<
      (
        file: File,
        settings: typeof SETTINGS_DEFAULTS,
        options?: { signal?: AbortSignal },
      ) => Promise<PreviewResult>
    >(async () => ({
      ok: true,
      blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }),
    }));

    let urlSeq = 0;
    const createObjectURL = vi.fn(() => `blob:preview-${++urlSeq}`);
    const revokeObjectURL = vi.fn();

    const controller = createLivePreviewController(
      {
        onUrl: (url) => {
          urls.push(url);
        },
        onError: (message) => {
          errors.push(message);
        },
      },
      {
        postPreviewFn,
        debounceMs: PREVIEW_DEBOUNCE_MS,
        createObjectURL,
        revokeObjectURL,
      },
    );

    return {
      controller,
      postPreviewFn,
      urls,
      errors,
      createObjectURL,
      revokeObjectURL,
    };
  }

  it('requests immediately on file select and shows object URL', async () => {
    const { controller, postPreviewFn, urls } = setup();
    const file = pngFile();

    controller.requestImmediate(file, SETTINGS_DEFAULTS);
    await vi.runAllTimersAsync();

    expect(postPreviewFn).toHaveBeenCalledTimes(1);
    expect(postPreviewFn.mock.calls[0]?.[0]).toBe(file);
    expect(urls).toEqual(['blob:preview-1']);
  });

  it('debounces visual settings changes', async () => {
    const { controller, postPreviewFn } = setup();
    const file = pngFile();

    controller.requestDebounced(file, { ...SETTINGS_DEFAULTS, padding: 1 });
    controller.requestDebounced(file, { ...SETTINGS_DEFAULTS, padding: 2 });
    controller.requestDebounced(file, { ...SETTINGS_DEFAULTS, padding: 3 });

    expect(postPreviewFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(PREVIEW_DEBOUNCE_MS - 1);
    expect(postPreviewFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();

    expect(postPreviewFn).toHaveBeenCalledTimes(1);
    expect(postPreviewFn.mock.calls[0]?.[1]).toMatchObject({ padding: 3 });
  });

  it('aborts in-flight preview when a newer change starts', async () => {
    const { controller, postPreviewFn } = setup();
    const file = pngFile();

    let resolveFirst!: (value: PreviewResult) => void;
    const firstSignalRef: { current?: AbortSignal } = {};

    postPreviewFn.mockImplementationOnce(
      (_file, _settings, options) =>
        new Promise((resolve) => {
          firstSignalRef.current = options?.signal;
          resolveFirst = resolve;
        }),
    );

    controller.requestImmediate(file, SETTINGS_DEFAULTS);
    await Promise.resolve();

    expect(postPreviewFn).toHaveBeenCalledTimes(1);
    expect(firstSignalRef.current?.aborted).toBe(false);

    controller.requestImmediate(file, { ...SETTINGS_DEFAULTS, padding: 10 });
    await Promise.resolve();

    expect(firstSignalRef.current?.aborted).toBe(true);
    expect(postPreviewFn).toHaveBeenCalledTimes(2);

    // Stale first response must not update UI
    resolveFirst({
      ok: true,
      blob: new Blob([new Uint8Array([9])], { type: 'image/png' }),
    });
    await Promise.resolve();

    await vi.runAllTimersAsync();
    expect(postPreviewFn).toHaveBeenCalledTimes(2);
  });

  it('ignores aborted results and does not update the URL', async () => {
    const { controller, postPreviewFn, urls } = setup();
    const file = pngFile();

    postPreviewFn.mockResolvedValueOnce({
      ok: false,
      aborted: true,
      message: '',
    });

    controller.requestImmediate(file, SETTINGS_DEFAULTS);
    await vi.runAllTimersAsync();

    expect(urls).toEqual([]);
  });

  it('clear aborts pending work and hides preview', async () => {
    const { controller, postPreviewFn, urls, revokeObjectURL } = setup();
    const file = pngFile();

    controller.requestImmediate(file, SETTINGS_DEFAULTS);
    await vi.runAllTimersAsync();
    expect(urls).toEqual(['blob:preview-1']);

    let resolveSlow!: (value: PreviewResult) => void;
    const signalRef: { current?: AbortSignal } = {};
    postPreviewFn.mockImplementationOnce(
      (_file, _settings, options) =>
        new Promise((resolve) => {
          signalRef.current = options?.signal;
          resolveSlow = resolve;
        }),
    );

    controller.requestDebounced(file, { ...SETTINGS_DEFAULTS, padding: 5 });
    await vi.advanceTimersByTimeAsync(PREVIEW_DEBOUNCE_MS);
    await Promise.resolve();
    expect(postPreviewFn).toHaveBeenCalledTimes(2);

    controller.clear();
    expect(signalRef.current?.aborted).toBe(true);
    expect(urls.at(-1)).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');

    resolveSlow({
      ok: true,
      blob: new Blob([new Uint8Array([7])], { type: 'image/png' }),
    });
    await Promise.resolve();
    expect(urls.filter(Boolean)).toEqual(['blob:preview-1']);
  });

  it('replace file keeps caller settings and re-previews immediately', async () => {
    const { controller, postPreviewFn } = setup();
    const first = pngFile('a.png');
    const second = pngFile('b.png');
    const settings = {
      ...SETTINGS_DEFAULTS,
      padding: 20,
      cornerRadius: 40,
      monochrome: true,
      presets: ['favicon'],
    };

    controller.requestImmediate(first, settings);
    await vi.runAllTimersAsync();

    controller.requestImmediate(second, settings);
    await vi.runAllTimersAsync();

    expect(postPreviewFn).toHaveBeenCalledTimes(2);
    expect(postPreviewFn.mock.calls[1]?.[0]).toBe(second);
    expect(postPreviewFn.mock.calls[1]?.[1]).toEqual(settings);
  });
});
