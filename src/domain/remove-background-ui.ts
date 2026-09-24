/** Default polite status while removal is in flight without a ratio yet. */
export const REMOVE_BACKGROUND_LIVE_PENDING = 'Removing background…';

export const REMOVE_BACKGROUND_ERROR_UNSUPPORTED
  = 'Background removal is only available for PNG and JPG.';

export const REMOVE_BACKGROUND_ERROR_FAILED
  = 'Background removal failed. Try again with a different image.';

export interface RemoveBackgroundSourceState {
  file: File;
  error: string | null;
  /** Pre-removal source when Undo is available; otherwise `null`. */
  undoFile: File | null;
}

/**
 * Label from library progress (`current` / `total`).
 * Used for aria-live while model download / inference runs.
 */
export function removeBackgroundProgressLabel(
  current: number,
  total: number,
): string {
  if (!(total > 0) || !Number.isFinite(current) || !Number.isFinite(total))
    return REMOVE_BACKGROUND_LIVE_PENDING;
  const pct = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  return `${REMOVE_BACKGROUND_LIVE_PENDING} ${pct}%`;
}

/**
 * Text for the polite live region: progress while pending, else error message.
 * Empty string when idle with no error.
 */
export function removeBackgroundLiveStatus(
  pending: boolean,
  error: string | null,
  progressLabel: string | null = null,
): string {
  if (pending)
    return progressLabel ?? REMOVE_BACKGROUND_LIVE_PENDING;
  return error ?? '';
}

/**
 * Apply a removal result: success replaces the file and stores the prior file for Undo;
 * failure keeps the prior file and error message (undo buffer unchanged).
 */
export function applyRemoveBackgroundResult(
  previous: File,
  result: { ok: true; file: File } | { ok: false; message: string },
  previousUndo: File | null = null,
): RemoveBackgroundSourceState {
  if (result.ok)
    return { file: result.file, error: null, undoFile: previous };
  return { file: previous, error: result.message, undoFile: previousUndo };
}

/** Restore the pre-removal file and clear the undo buffer. No-op when none. */
export function undoRemoveBackground(
  state: RemoveBackgroundSourceState,
): RemoveBackgroundSourceState {
  if (!state.undoFile)
    return state;
  return { file: state.undoFile, error: null, undoFile: null };
}

/** Drop the undo buffer (Clear or replace source). */
export function discardRemoveBackgroundUndo(
  state: Pick<RemoveBackgroundSourceState, 'file' | 'error'>,
): RemoveBackgroundSourceState {
  return { file: state.file, error: state.error, undoFile: null };
}
