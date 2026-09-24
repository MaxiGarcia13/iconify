import type { APIRoute } from 'astro';

import { renderIcon } from '@/domain/icons/process';
import { parsePreviewForm } from '@/domain/validate';
import { jsonError } from '@/lib/json-error';
import { isSameOriginRequest } from '@/lib/same-origin';

export const prerender = false;

/** Dropzone live preview size (SPEC §3.3). */
const PREVIEW_SIZE = 256;

const FORBIDDEN_ORIGIN_MESSAGE
  = 'This endpoint is only available from the Iconify UI (same origin).';

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
    const parsed = await parsePreviewForm(form);
    if (!parsed.ok) {
      return jsonError(400, 'VALIDATION_ERROR', parsed.message, parsed.details);
    }

    const png = await renderIcon(parsed.file, PREVIEW_SIZE, parsed.options);
    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[iconify] preview failed', err);
    return jsonError(500, 'PROCESSING_ERROR', 'Failed to process image.');
  }
};
