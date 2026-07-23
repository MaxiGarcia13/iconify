/**
 * Same-origin gate for private API routes — SPEC §3.3.
 * `Origin` must be present and equal the request URL origin.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin)
    return false;

  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
