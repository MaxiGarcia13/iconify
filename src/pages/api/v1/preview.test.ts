import { Buffer } from 'node:buffer';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { solidPng } from '@/test/fixtures';
import { POST } from './preview';

const PREVIEW_URL = 'http://localhost/api/v1/preview';
const SAME_ORIGIN = new URL(PREVIEW_URL).origin;

function apiContext(request: Request) {
  return { request } as Parameters<typeof POST>[0];
}

async function multipartRequest(
  fields: Record<string, string | File>,
  options?: { origin?: string | null },
): Promise<Request> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields))
    form.set(key, value);

  const headers = new Headers();
  if (options?.origin !== null)
    headers.set('Origin', options?.origin ?? SAME_ORIGIN);

  return new Request(PREVIEW_URL, {
    method: 'POST',
    headers,
    body: form,
  });
}

async function pngFile(): Promise<File> {
  const png = await solidPng();
  return new File([Uint8Array.from(png)], 'logo.png', { type: 'image/png' });
}

describe('post /api/v1/preview', () => {
  it('returns a 256×256 PNG and does not require presets', async () => {
    const request = await multipartRequest({
      file: await pngFile(),
      padding: '20',
      presets: 'not-a-preset',
    });

    const response = await POST(apiContext(request));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();

    const bytes = Buffer.from(await response.arrayBuffer());
    const meta = await sharp(bytes).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
  });

  it('returns 400 VALIDATION_ERROR for an invalid option', async () => {
    const request = await multipartRequest({
      file: await pngFile(),
      padding: '80',
    });

    const response = await POST(apiContext(request));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Invalid padding. Expected a number from 0 to 50.',
      details: { field: 'padding' },
    });
  });

  it('applies visual options (padding changes the PNG)', async () => {
    const file = await pngFile();
    const plain = await POST(apiContext(await multipartRequest({
      file,
      padding: '0',
    })));
    const padded = await POST(apiContext(await multipartRequest({
      file,
      padding: '40',
    })));

    expect(plain.status).toBe(200);
    expect(padded.status).toBe(200);
    const plainBytes = Buffer.from(await plain.arrayBuffer());
    const paddedBytes = Buffer.from(await padded.arrayBuffer());
    expect(Buffer.compare(plainBytes, paddedBytes)).not.toBe(0);
  });

  it('returns 400 VALIDATION_ERROR for a disallowed file type', async () => {
    const request = await multipartRequest({
      file: new File([Uint8Array.from([1, 2, 3])], 'logo.gif', {
        type: 'image/gif',
      }),
    });

    const response = await POST(apiContext(request));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: 'VALIDATION_ERROR',
      details: { field: 'file' },
    });
  });

  it('returns 403 FORBIDDEN_ORIGIN when Origin is missing', async () => {
    const request = await multipartRequest(
      { file: await pngFile() },
      { origin: null },
    );

    const response = await POST(apiContext(request));
    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(await response.json()).toMatchObject({ error: 'FORBIDDEN_ORIGIN' });
  });

  it('returns 403 FORBIDDEN_ORIGIN for a cross-origin Origin', async () => {
    const request = await multipartRequest(
      { file: await pngFile() },
      { origin: 'https://evil.example' },
    );

    const response = await POST(apiContext(request));
    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(await response.json()).toMatchObject({ error: 'FORBIDDEN_ORIGIN' });
  });

  it('returns 415 when the body is not multipart', async () => {
    const request = new Request(PREVIEW_URL, {
      method: 'POST',
      headers: {
        'Origin': SAME_ORIGIN,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    const response = await POST(apiContext(request));
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({
      error: 'UNSUPPORTED_MEDIA_TYPE',
    });
  });
});
