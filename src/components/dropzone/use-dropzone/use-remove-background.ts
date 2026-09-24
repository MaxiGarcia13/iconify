import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { DropzoneState } from '../types';

import { useRef, useState } from 'react';

import {
  applyRemoveBackgroundResult,
  isRemoveBackgroundDisabled,
} from '@/domain/remove-background-ui';
import { createRemoveBackgroundRunner } from '@/services/remove-background-runner';

export interface UseDropzoneRemoveBackgroundOptions {
  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setState: Dispatch<SetStateAction<DropzoneState>>;
  onFileChangeRef: RefObject<((file: File | null) => void) | undefined>;
  disabled: boolean;
  previewPending: boolean;
}

export function useDropzoneRemoveBackground({
  file,
  setFile,
  setError,
  setState,
  onFileChangeRef,
  disabled,
  previewPending,
}: UseDropzoneRemoveBackgroundOptions) {
  const [removalPending, setRemovalPending] = useState(false);

  const runnerRef = useRef(createRemoveBackgroundRunner({
    onPending: setRemovalPending,
    onResult: (result) => {
      setFile((previous) => {
        if (!previous)
          return previous;
        const applied = applyRemoveBackgroundResult(previous, result);
        setError(applied.error);
        if (result.ok) {
          setState('ready');
          onFileChangeRef.current?.(applied.file);
        }
        return applied.file;
      });
    },
  }));

  function cancel() {
    runnerRef.current.cancel();
  }

  function onRemoveBackground() {
    if (!file)
      return;
    if (isRemoveBackgroundDisabled({
      file,
      removalPending,
      generatePending: disabled,
      previewPending,
    })) {
      return;
    }
    void runnerRef.current.run(file);
  }

  const removeBackgroundDisabled = isRemoveBackgroundDisabled({
    file,
    removalPending,
    generatePending: disabled,
    previewPending,
  });

  return {
    removalPending,
    removeBackgroundDisabled,
    cancel,
    onRemoveBackground,
  };
}
