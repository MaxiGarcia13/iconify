export interface DropzoneStatusProps {
  inputId: string;
  error: string | null;
}

/** Live region for validation errors. */
export function DropzoneStatus({ inputId, error }: DropzoneStatusProps) {
  return (
    <p
      id={`${inputId}-error`}
      role="status"
      aria-live="polite"
      className={error ? 'text-sm text-red-600 dark:text-red-400' : 'sr-only'}
    >
      {error ?? ''}
    </p>
  );
}
