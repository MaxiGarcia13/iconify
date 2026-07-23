/** Max upload size — SPEC §3.2. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types — SPEC §3.2 / §5.3. */
export const ALLOWED_MIME = new Set([
  'image/svg+xml',
  'image/png',
  'image/jpeg',
]);

/** Allowed extensions — SPEC §3.2 / §5.3. */
export const ALLOWED_EXTENSIONS = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
]);

/**
 * `<input accept>` value — SPEC §5.3 Dropzone.
 * Extensions + matching MIME list.
 */
export const DROPZONE_ACCEPT
  = '.svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg';

export type SourceFileValidation
  = | { ok: true }
    | { ok: false; message: string };

export function normalizeMime(type: string): string {
  return (type.trim().toLowerCase().split(';')[0] ?? '').trim();
}

export function extensionOf(filename: string): string {
  const i = filename.lastIndexOf('.');
  if (i < 0)
    return '';
  return filename.slice(i).toLowerCase();
}

/**
 * Whether the upload should emit SVG assets / SVG `<link>` in the head snippet.
 * Matches server `sourceIsSvg` — SPEC §4 / §5.3.
 */
export function isSourceSvg(file: { name: string; type: string }): boolean {
  const mime = normalizeMime(file.type);
  const ext = extensionOf(file.name);
  return mime === 'image/svg+xml' || ext === '.svg';
}

/**
 * Client/server shared source-file checks — SPEC §3.2 / §5.3.
 * Rejects when MIME or extension is not allowed, or size exceeds 10 MB.
 */
export function validateSourceFile(file: {
  name: string;
  type: string;
  size: number;
}): SourceFileValidation {
  const mime = normalizeMime(file.type);
  const ext = extensionOf(file.name);

  if (!ALLOWED_MIME.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      message: 'Unsupported file type. Allowed: SVG, PNG, JPG.',
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      message: 'File exceeds maximum size of 10MB.',
    };
  }

  return { ok: true };
}
