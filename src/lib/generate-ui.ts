/**
 * Generate-button UX helpers — SPEC §5.2 steps 5–7 / §5.4.
 * Loading, disabled, and aria-live status copy (client-safe).
 */

export const GENERATE_BUTTON_IDLE_LABEL = 'Generate & Download ZIP';
export const GENERATE_BUTTON_PENDING_LABEL = 'Generating…';
export const GENERATE_LIVE_PENDING = 'Generating package…';

/** Button label for idle vs in-flight generate. */
export function generateButtonLabel(pending: boolean): string {
  return pending ? GENERATE_BUTTON_PENDING_LABEL : GENERATE_BUTTON_IDLE_LABEL;
}

/**
 * Text for the polite live region: progress while pending, else error message.
 * Empty string when idle with no error (region stays present but silent).
 */
export function generateLiveStatus(
  pending: boolean,
  error: string | null,
): string {
  if (pending)
    return GENERATE_LIVE_PENDING;
  return error ?? '';
}

/** Disabled until a valid file is present, and while a request is in flight. */
export function isGenerateDisabled(
  hasFile: boolean,
  pending: boolean,
): boolean {
  return !hasFile || pending;
}
