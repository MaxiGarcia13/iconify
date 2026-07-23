import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildGenerateFormData,
  DEFAULT_ZIP_FILENAME,
  filenameFromContentDisposition,
  GENERATE_ENDPOINT,
  messageFromErrorResponse,
  postGenerateDownload,
} from './generate-download';
import { SETTINGS_DEFAULTS } from './settings';

function pngFile(name = 'logo.png'): File {
  return new File([new Uint8Array([137, 80, 78, 71])], name, {
    type: 'image/png',
  });
}

describe('buildGenerateFormData', () => {
  it('sets file + SPEC §5.5 option fields', () => {
    const file = pngFile();
    const body = buildGenerateFormData(file, {
      ...SETTINGS_DEFAULTS,
      padding: 12,
      cornerRadius: 40,
      monochrome: true,
      transparent: false,
      backgroundHex: '#abcdef',
      presets: ['favicon', 'og'],
    });

    expect(body.get('file')).toBe(file);
    expect(body.get('padding')).toBe('12');
    expect(body.get('cornerRadius')).toBe('40');
    expect(body.get('monochrome')).toBe('true');
    expect(body.get('background')).toBe('#abcdef');
    expect(body.get('presets')).toBe('favicon,og');
  });
});

describe('filenameFromContentDisposition', () => {
  it('parses quoted filename', () => {
    expect(
      filenameFromContentDisposition(
        'attachment; filename="iconify-package.zip"',
      ),
    ).toBe('iconify-package.zip');
  });

  it('parses filename* UTF-8 form', () => {
    expect(
      filenameFromContentDisposition(
        'attachment; filename*=UTF-8\'\'icons%20pack.zip',
      ),
    ).toBe('icons pack.zip');
  });

  it('returns null when missing', () => {
    expect(filenameFromContentDisposition(null)).toBeNull();
    expect(filenameFromContentDisposition('inline')).toBeNull();
  });
});

describe('messageFromErrorResponse', () => {
  it('reads ErrorResponse.message', async () => {
    const response = new Response(
      JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: 'File exceeds maximum size of 10MB.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
    expect(await messageFromErrorResponse(response)).toBe(
      'File exceeds maximum size of 10MB.',
    );
  });

  it('falls back when body is not JSON', async () => {
    const response = new Response('nope', { status: 500 });
    expect(await messageFromErrorResponse(response)).toBe(
      'Request failed (500).',
    );
  });
});

describe('postGenerateDownload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ZIP blob and Content-Disposition filename on 200', async () => {
    const zipBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(zipBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="iconify-package.zip"',
        },
      }),
    );

    const result = await postGenerateDownload(
      pngFile(),
      SETTINGS_DEFAULTS,
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      GENERATE_ENDPOINT,
      expect.objectContaining({ method: 'POST' }),
    );
    const callBody = fetchImpl.mock.calls[0]?.[1]?.body;
    expect(callBody).toBeInstanceOf(FormData);
    expect((callBody as FormData).get('file')).toBeInstanceOf(File);

    expect(result.ok).toBe(true);
    if (!result.ok)
      return;
    expect(result.filename).toBe(DEFAULT_ZIP_FILENAME);
    expect(result.blob.type).toMatch(/application\/zip|octet-stream/);
    expect(await result.blob.arrayBuffer()).toEqual(zipBytes.buffer);
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

    const result = await postGenerateDownload(
      pngFile(),
      SETTINGS_DEFAULTS,
      fetchImpl,
    );

    expect(result).toEqual({
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
    });
  });

  it('returns network error when fetch throws', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await postGenerateDownload(
      pngFile(),
      SETTINGS_DEFAULTS,
      fetchImpl,
    );

    expect(result.ok).toBe(false);
    if (result.ok)
      return;
    expect(result.message).toMatch(/network/i);
  });
});
