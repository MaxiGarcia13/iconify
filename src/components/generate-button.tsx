import type { SettingsState } from '../lib/settings';

import { useId, useState } from 'react';

import {
  postGenerateDownload,
  triggerBlobDownload,
} from '../lib/generate-download';

export interface GenerateButtonProps {
  file: File | null;
  settings: SettingsState;
  /** Called after a successful ZIP download trigger — SPEC §5.2 step 6. */
  onSuccess?: () => void;
}

/**
 * Generate & Download ZIP — SPEC §5.1 / §5.2 steps 5–7 / §5.5.
 * Disabled until a valid file is present (§5.4).
 */
export function GenerateButton({
  file,
  settings,
  onSuccess,
}: GenerateButtonProps) {
  const errorId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = Boolean(file) && !pending;

  async function onGenerate() {
    if (!file || pending)
      return;

    setPending(true);
    setError(null);

    const result = await postGenerateDownload(file, settings);
    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    triggerBlobDownload(result.blob, result.filename);
    onSuccess?.();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={!canGenerate}
        aria-busy={pending}
        aria-describedby={error ? errorId : undefined}
        onClick={() => {
          void onGenerate();
        }}
        className={[
          'w-full border border-surface-border px-4 py-3 text-sm font-medium transition-colors',
          'bg-accent text-accent-foreground',
          'hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent',
        ].join(' ')}
      >
        {pending ? 'Generating…' : 'Generate & Download ZIP'}
      </button>

      <p
        id={errorId}
        role="status"
        aria-live="polite"
        className={error ? 'text-sm text-red-600 dark:text-red-400' : 'sr-only'}
      >
        {error ?? ''}
      </p>
    </div>
  );
}
