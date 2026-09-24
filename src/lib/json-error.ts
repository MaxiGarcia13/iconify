/** SPEC §3.4 error JSON: `{ error, message, details? }`. */
export function jsonError(
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
