import type { APIRoute } from 'astro';

import { processIconPackage, zipToWebResponse } from '../../../lib/icons/package';
import { parseGenerateForm } from '../../../lib/validate';

export const prerender = false;

/** `POST /api/v1/generate` — SPEC §3 / §4.7. */
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return jsonError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Expected multipart/form-data.');
    }

    const form = await request.formData();
    const parsed = await parseGenerateForm(form);
    if (!parsed.ok) {
      return jsonError(400, 'VALIDATION_ERROR', parsed.message, parsed.details);
    }

    const result = await processIconPackage(
      parsed.file,
      parsed.options,
      parsed.sourceIsSvg,
    );
    return zipToWebResponse(result.assets);
  } catch (err) {
    console.error('[iconify] generate failed', err);
    return jsonError(500, 'PROCESSING_ERROR', 'Failed to process image.');
  }
};

function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>,
) {
  const body
    = details === undefined
      ? { error, message }
      : { error, message, details };

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
