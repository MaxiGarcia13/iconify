export interface DropzoneStatusProps {
  inputId: string;
  /** Polite live region text (pending or error). */
  liveStatus: string;
  /** When true, style the message as a visible error. */
  errorTone?: boolean;
}

/**
 * Errors are visible; pending is announced for assistive tech only
 * (the Remove background button already shows pending copy).
 */
export function DropzoneStatus({
  inputId,
  liveStatus,
  errorTone = false,
}: DropzoneStatusProps) {
  return (
    <p
      id={`${inputId}-error`}
      role="status"
      aria-live="polite"
      className={
        liveStatus && errorTone
          ? 'text-sm text-red-600 dark:text-red-400'
          : 'sr-only'
      }
    >
      {liveStatus}
    </p>
  );
}
