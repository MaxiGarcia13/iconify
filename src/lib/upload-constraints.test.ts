import { describe, expect, it } from 'vitest';

import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME,
  DROPZONE_ACCEPT,
  extensionOf,
  isSourceSvg,
  MAX_UPLOAD_BYTES,
  normalizeMime,
  validateSourceFile,
} from './upload-constraints';

describe('upload-constraints', () => {
  it('exposes SPEC §3.2 / §5.3 accept list for the dropzone', () => {
    expect(DROPZONE_ACCEPT).toContain('.svg');
    expect(DROPZONE_ACCEPT).toContain('.png');
    expect(DROPZONE_ACCEPT).toContain('.jpg');
    expect(DROPZONE_ACCEPT).toContain('.jpeg');
    expect(DROPZONE_ACCEPT).toContain('image/svg+xml');
    expect(DROPZONE_ACCEPT).toContain('image/png');
    expect(DROPZONE_ACCEPT).toContain('image/jpeg');
    expect(ALLOWED_MIME.has('image/png')).toBe(true);
    expect(ALLOWED_EXTENSIONS.has('.jpg')).toBe(true);
  });

  it('normalizes MIME and extensions', () => {
    expect(normalizeMime(' image/PNG ; charset=binary ')).toBe('image/png');
    expect(extensionOf('Logo.JPEG')).toBe('.jpeg');
    expect(extensionOf('noext')).toBe('');
  });

  it('accepts SVG / PNG / JPEG within 10 MB', () => {
    expect(
      validateSourceFile({
        name: 'mark.svg',
        type: 'image/svg+xml',
        size: 128,
      }),
    ).toEqual({ ok: true });

    expect(
      validateSourceFile({
        name: 'logo.png',
        type: 'image/png',
        size: 1024,
      }),
    ).toEqual({ ok: true });

    expect(
      validateSourceFile({
        name: 'photo.jpg',
        type: 'image/jpeg',
        size: MAX_UPLOAD_BYTES,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects invalid type/extension (client AC3 parity)', () => {
    expect(
      validateSourceFile({
        name: 'anim.gif',
        type: 'image/gif',
        size: 100,
      }),
    ).toEqual({
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
    });

    expect(
      validateSourceFile({
        name: 'fake.png',
        type: 'image/gif',
        size: 100,
      }),
    ).toEqual({
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
    });
  });

  it('rejects uploads larger than 10 MB', () => {
    expect(
      validateSourceFile({
        name: 'huge.png',
        type: 'image/png',
        size: MAX_UPLOAD_BYTES + 1,
      }),
    ).toEqual({
      ok: false,
      message: 'File exceeds maximum size of 10MB.',
    });
  });

  it('detects SVG sources for head snippet / matrix (SPEC §5.3)', () => {
    expect(isSourceSvg({ name: 'mark.svg', type: 'image/svg+xml' })).toBe(true);
    expect(isSourceSvg({ name: 'mark.SVG', type: '' })).toBe(true);
    expect(isSourceSvg({ name: 'logo.png', type: 'image/png' })).toBe(false);
    expect(isSourceSvg({ name: 'logo.png', type: 'image/svg+xml' })).toBe(true);
  });
});
