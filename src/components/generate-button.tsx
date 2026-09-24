import type { SettingsState } from '@/lib/settings';

import { cn } from '@maxigarcia/js-utils';
import { useEffect, useId, useState } from 'react';

import {
  postGenerateDownload,
  triggerBlobDownload,
} from '@/lib/generate-download';
import {
  generateButtonLabel,
  generateLiveStatus,
  isGenerateDisabled,
} from '@/lib/generate-ui';

export interface GenerateButtonProps {
  file: File | null;
  settings: SettingsState;
  onSuccess?: () => void;
  onPendingChange?: (pending: boolean) => void;
}

export function GenerateButton({
  file,
  settings,
  onSuccess,
  onPendingChange,
}: GenerateButtonProps) {
  const statusId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = isGenerateDisabled(Boolean(file), pending);
  const liveStatus = generateLiveStatus(pending, error);
  const showError = Boolean(error) && !pending;

  useEffect(() => {
    setError(null);
  }, [file]);

  function setPendingState(next: boolean) {
    setPending(next);
    onPendingChange?.(next);
  }

  async function onGenerate() {
    if (!file || pending)
      return;

    setPendingState(true);
    setError(null);

    const result = await postGenerateDownload(file, settings);
    if (!result.ok) {
      setError(result.message);
      setPendingState(false);
      return;
    }

    triggerBlobDownload(result.blob, result.filename);
    onSuccess?.();
    setPendingState(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={disabled}
        aria-busy={pending}
        aria-describedby={liveStatus ? statusId : undefined}
        onClick={() => {
          void onGenerate();
        }}
        className={cn(
          'touch-manipulation w-full min-h-11 border border-surface-border px-4 py-3 text-sm font-medium transition-colors',
          'bg-accent text-accent-foreground',
          'hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent',
        )}
      >
        {generateButtonLabel(pending)}
      </button>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={
          showError
            ? 'text-sm text-red-600 dark:text-red-400'
            : 'sr-only'
        }
      >
        {liveStatus}
      </p>
    </div>
  );
}
