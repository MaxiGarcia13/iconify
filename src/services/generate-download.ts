import type { SettingsState } from '@/domain/settings';

import { appendSettingsToFormData } from '@/domain/settings';

export const DEFAULT_ZIP_FILENAME = 'iconify-package.zip';

export const GENERATE_ENDPOINT = '/api/v1/generate';

export type GenerateDownloadResult
  = | { ok: true; blob: Blob; filename: string }
    | { ok: false; message: string };

export function buildGenerateFormData(
  file: File,
  settings: SettingsState,
): FormData {
  const body = new FormData();
  body.set('file', file);
  appendSettingsToFormData(body, settings);
  return body;
}

/**
 * Parse `Content-Disposition` attachment filename, or `null` if absent/invalid.
 */
export function filenameFromContentDisposition(
  header: string | null,
): string | null {
  if (!header)
    return null;

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }

  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1])
    return quoted[1];

  const bare = /filename=([^;\s]+)/i.exec(header);
  if (bare?.[1])
    return bare[1].replace(/^["']|["']$/g, '');

  return null;
}

/** Read JSON error `message`; fall back if the body is not JSON. */
export async function messageFromErrorResponse(
  response: Response,
): Promise<string> {
  const fallback = `Request failed (${response.status}).`;
  try {
    const data: unknown = await response.json();
    if (
      data
      && typeof data === 'object'
      && 'message' in data
      && typeof (data as { message: unknown }).message === 'string'
      && (data as { message: string }).message.trim()
    ) {
      return (data as { message: string }).message;
    }
  } catch {
    // non-JSON body
  }
  return fallback;
}

export async function postGenerateDownload(
  file: File,
  settings: SettingsState,
  fetchImpl: typeof fetch = fetch,
): Promise<GenerateDownloadResult> {
  const body = buildGenerateFormData(file, settings);
  let response: Response;

  try {
    response = await fetchImpl(GENERATE_ENDPOINT, {
      method: 'POST',
      body,
    });
  } catch {
    return { ok: false, message: 'Network error. Check your connection and try again.' };
  }

  if (!response.ok) {
    return { ok: false, message: await messageFromErrorResponse(response) };
  }

  const blob = await response.blob();
  const filename
    = filenameFromContentDisposition(response.headers.get('Content-Disposition'))
      ?? DEFAULT_ZIP_FILENAME;

  return { ok: true, blob, filename };
}

/**
 * Trigger a browser download from a blob URL (revoked after click).
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
