export interface DropzoneStatusProps {
  inputId: string;
  /** Polite live region text (progress or error). */
  liveStatus: string;
  /** When true, style the message as an error (idle failures only). */
  errorTone?: boolean;
}

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
