import type { APIRoute } from 'astro';

import { processIconPackage, zipToWebResponse } from '@/lib/icons/package';
import { isSameOriginRequest } from '@/lib/same-origin';
import { parseGenerateForm } from '@/lib/validate';

export const prerender = false;

const FORBIDDEN_ORIGIN_MESSAGE
  = 'This endpoint is only available from the Iconify UI (same origin).';

/** `POST /api/v1/generate` — SPEC §3 / §3.3 / §4.7. */
export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isSameOriginRequest(request)) {
      return jsonError(403, 'FORBIDDEN_ORIGIN', FORBIDDEN_ORIGIN_MESSAGE);
    }

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
      parsed.sourceFilename,
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
