import type { SettingsState } from '@/domain/settings';

import { appendVisualSettingsToFormData } from '@/domain/settings';
import { messageFromErrorResponse } from './generate-download';

export const PREVIEW_ENDPOINT = '/api/v1/preview';

export type PreviewResult
  = | { ok: true; blob: Blob }
    | { ok: false; message: string; aborted?: boolean };

export function buildPreviewFormData(
  file: File,
  settings: SettingsState,
): FormData {
  const body = new FormData();
  body.set('file', file);
  appendVisualSettingsToFormData(body, settings);
  return body;
}

function isAbortError(err: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError')
    || (err instanceof Error && err.name === 'AbortError')
  );
}

/**
 * POST processed 256×256 PNG for the dropzone live preview (SPEC §3.3).
 * Pass `signal` so callers can abort when settings/file change again.
 */
export async function postPreview(
  file: File,
  settings: SettingsState,
  options: {
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<PreviewResult> {
  const { signal, fetchImpl = fetch } = options;
  const body = buildPreviewFormData(file, settings);

  let response: Response;
  try {
    response = await fetchImpl(PREVIEW_ENDPOINT, {
      method: 'POST',
      body,
      signal,
    });
  } catch (err) {
    if (signal?.aborted || isAbortError(err))
      return { ok: false, aborted: true, message: '' };
    return { ok: false, message: 'Network error. Check your connection and try again.' };
  }

  if (!response.ok) {
    return { ok: false, message: await messageFromErrorResponse(response) };
  }

  return { ok: true, blob: await response.blob() };
}
