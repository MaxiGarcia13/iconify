import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import { solidPng } from '../../../test/fixtures';
import { POST } from './generate';

function apiContext(request: Request) {
  return { request } as Parameters<typeof POST>[0];
}

describe('post /api/v1/generate', () => {
  it('returns 415 UNSUPPORTED_MEDIA_TYPE when Content-Type is not multipart', async () => {
    const request = new Request('http://localhost/api/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    const response = await POST(apiContext(request));
    expect(response.status).toBe(415);

    const body = await response.json();
    expect(body).toEqual({
      error: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Expected multipart/form-data.',
    });
  });

  it('returns 400 VALIDATION_ERROR when file is missing', async () => {
    const form = new FormData();
    form.set('padding', '0');

    const request = new Request('http://localhost/api/v1/generate', {
      method: 'POST',
      body: form,
    });

    const response = await POST(apiContext(request));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.details).toEqual({ field: 'file' });
  });

  it('returns 200 application/zip with Content-Disposition for a valid PNG', async () => {
    const png = await solidPng();
    const form = new FormData();
    form.set(
      'file',
      new File([Uint8Array.from(png)], 'logo.png', { type: 'image/png' }),
    );
    form.set('presets', 'favicon');

    const request = new Request('http://localhost/api/v1/generate', {
      method: 'POST',
      body: form,
    });

    const response = await POST(apiContext(request));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="iconify-package.zip"',
    );

    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(bytes.subarray(0, 2).toString('ascii')).toBe('PK');
  });
});
