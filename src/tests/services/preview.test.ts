import { afterEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_DEFAULTS } from '@/domain/settings';
import {
  buildPreviewFormData,
  PREVIEW_ENDPOINT,
  postPreview,
} from '@/services/preview';

function pngFile(name = 'logo.png'): File {
  return new File([new Uint8Array([137, 80, 78, 71])], name, {
    type: 'image/png',
  });
}

describe('buildPreviewFormData', () => {
  it('sets file + visual options and omits presets (SPEC §3.3)', () => {
    const file = pngFile();
    const body = buildPreviewFormData(file, {
      ...SETTINGS_DEFAULTS,
      padding: 12,
      cornerRadius: 40,
      monochrome: true,
      transparent: false,
      backgroundHex: '#abcdef',
      presets: ['favicon', 'og', 'original'],
    });

    expect(body.get('file')).toBe(file);
    expect(body.get('padding')).toBe('12');
    expect(body.get('cornerRadius')).toBe('40');
    expect(body.get('monochrome')).toBe('true');
    expect(body.get('background')).toBe('#abcdef');
    expect(body.get('presets')).toBeNull();
  });
});

describe('postPreview', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns PNG blob on 200', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 0, 0]);
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(pngBytes, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      }),
    );

    const result = await postPreview(pngFile(), SETTINGS_DEFAULTS, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      PREVIEW_ENDPOINT,
      expect.objectContaining({ method: 'POST' }),
    );
    const callBody = fetchImpl.mock.calls[0]?.[1]?.body;
    expect(callBody).toBeInstanceOf(FormData);
    expect((callBody as FormData).get('presets')).toBeNull();

    expect(result.ok).toBe(true);
    if (!result.ok)
      return;
    expect(await result.blob.arrayBuffer()).toEqual(pngBytes.buffer);
  });

  it('returns aborted when signal aborts', async () => {
    const ac = new AbortController();
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
      ac.abort();
      const signal = init?.signal;
      if (signal?.aborted) {
        const err = new Error('The operation was aborted.');
        err.name = 'AbortError';
        throw err;
      }
      return new Response(null, { status: 200 });
    });

    ac.abort();
    const result = await postPreview(pngFile(), SETTINGS_DEFAULTS, {
      fetchImpl,
      signal: ac.signal,
    });

    expect(result).toEqual({ ok: false, aborted: true, message: '' });
  });

  it('returns JSON message on 4xx', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await postPreview(pngFile(), SETTINGS_DEFAULTS, { fetchImpl });
    expect(result).toEqual({
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
    });
  });
});
