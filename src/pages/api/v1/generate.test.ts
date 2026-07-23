import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import { resolveMatrix } from '../../../lib/icons/matrix';
import { MAX_UPLOAD_BYTES } from '../../../lib/validate';
import { solidPng, solidSvg } from '../../../test/fixtures';
import { listZipEntryNames } from '../../../test/zip';
import { POST } from './generate';

function apiContext(request: Request) {
  return { request } as Parameters<typeof POST>[0];
}

async function multipartRequest(
  fields: Record<string, string | File>,
): Promise<Request> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields))
    form.set(key, value);

  return new Request('http://localhost/api/v1/generate', {
    method: 'POST',
    body: form,
  });
}

describe('post /api/v1/generate', () => {
  describe('200 streamed ZIP (SPEC §3 / §4.6)', () => {
    it('returns application/zip with Content-Disposition and matching membership', async () => {
      const png = await solidPng();
      const request = await multipartRequest({
        file: new File([Uint8Array.from(png)], 'logo.png', {
          type: 'image/png',
        }),
        presets: 'favicon',
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="iconify-package.zip"',
      );
      expect(response.headers.get('Cache-Control')).toBe('no-store');

      const expectedNames = resolveMatrix(['favicon'], false).map((e) => e.name);
      expect(response.headers.get('X-Iconify-Assets')).toBe(
        expectedNames.join(','),
      );

      const bytes = Buffer.from(await response.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThan(0);
      expect(bytes.subarray(0, 2).toString('ascii')).toBe('PK');
      expect(listZipEntryNames(bytes)).toEqual(expectedNames);
    });
  });

  describe('ZIP membership via API (curl equivalent / AC1 / AC2)', () => {
    it('PNG + presets=all ZIP matches §2.1–2.4 minus SVG (AC1)', async () => {
      const png = await solidPng();
      const request = await multipartRequest({
        file: new File([Uint8Array.from(png)], 'logo.png', {
          type: 'image/png',
        }),
        presets: 'all',
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(200);

      const expectedNames = resolveMatrix(['all'], false).map((e) => e.name);
      expect(expectedNames.some((n) => n.endsWith('.svg'))).toBe(false);
      expect(response.headers.get('X-Iconify-Assets')).toBe(
        expectedNames.join(','),
      );

      const names = listZipEntryNames(
        Buffer.from(await response.arrayBuffer()),
      );
      expect(names).toEqual(expectedNames);
      expect(names).not.toContain('favicon.svg');
      expect(names).not.toContain('safari-pinned-tab.svg');
    });

    it('SVG upload ZIP includes favicon.svg (AC2)', async () => {
      const svg = solidSvg();
      const request = await multipartRequest({
        file: new File([Uint8Array.from(svg)], 'logo.svg', {
          type: 'image/svg+xml',
        }),
        presets: 'all',
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(200);

      const expectedNames = resolveMatrix(['all'], true).map((e) => e.name);
      expect(expectedNames).toContain('favicon.svg');
      expect(response.headers.get('X-Iconify-Assets')).toBe(
        expectedNames.join(','),
      );

      const names = listZipEntryNames(
        Buffer.from(await response.arrayBuffer()),
      );
      expect(names).toEqual(expectedNames);
      expect(names).toContain('favicon.svg');
      expect(names).toContain('safari-pinned-tab.svg');
    });
  });

  describe('JSON error contract (SPEC §3.1)', () => {
    it('returns 415 UNSUPPORTED_MEDIA_TYPE when Content-Type is not multipart', async () => {
      const request = new Request('http://localhost/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(415);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({
        error: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Expected multipart/form-data.',
      });
      expect(body).not.toHaveProperty('details');
    });

    it('returns 400 VALIDATION_ERROR when file is missing', async () => {
      const request = await multipartRequest({ padding: '0' });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Missing file upload.',
        details: { field: 'file' },
      });
    });

    it('returns 400 VALIDATION_ERROR for invalid MIME (AC3)', async () => {
      const request = await multipartRequest({
        file: new File([new Uint8Array([0x47, 0x49, 0x46])], 'anim.gif', {
          type: 'image/gif',
        }),
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
        details: { field: 'file' },
      });
    });

    it('returns 400 VALIDATION_ERROR when file exceeds 10 MB (AC3)', async () => {
      const request = await multipartRequest({
        file: new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'huge.png', {
          type: 'image/png',
        }),
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'File exceeds maximum size of 10MB.',
        details: { field: 'file', maxBytes: MAX_UPLOAD_BYTES },
      });
    });

    it('returns 400 VALIDATION_ERROR for invalid options', async () => {
      const png = await solidPng();
      const request = await multipartRequest({
        file: new File([Uint8Array.from(png)], 'logo.png', {
          type: 'image/png',
        }),
        padding: '99',
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Invalid padding. Expected a number from 0 to 50.',
        details: { field: 'padding' },
      });
    });

    it('returns 500 PROCESSING_ERROR when Sharp cannot decode the image', async () => {
      const request = await multipartRequest({
        file: new File(
          [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
          'corrupt.png',
          { type: 'image/png' },
        ),
        presets: 'favicon',
      });

      const response = await POST(apiContext(request));
      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body).toEqual({
        error: 'PROCESSING_ERROR',
        message: 'Failed to process image.',
      });
      expect(body).not.toHaveProperty('details');
    });
  });
});
