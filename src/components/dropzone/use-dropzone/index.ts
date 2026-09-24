import type { DropzoneState } from '../types';

import type { UseDropzoneOptions, UseDropzoneResult } from './types';
import { useId, useRef, useState } from 'react';
import { removeBackgroundLiveStatus } from '@/domain/remove-background-ui';
import { useDropzoneFile } from './use-file';
import { useDropzoneRemoveBackground } from './use-remove-background';

export type { UseDropzoneOptions, UseDropzoneResult } from './types';

export function useDropzone({
  onFileChange,
  disabled = false,
  previewPending = false,
}: UseDropzoneOptions): UseDropzoneResult {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<DropzoneState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onFileChangeRef = useRef(onFileChange);
  onFileChangeRef.current = onFileChange;

  const remove = useDropzoneRemoveBackground({
    file,
    setFile,
    setError,
    setState,
    onFileChangeRef,
    disabled,
    previewPending,
  });

  const fileApi = useDropzoneFile({
    disabled,
    file,
    error,
    setFile,
    setError,
    setState,
    onFileChange,
    inputRef,
    onInterrupt: remove.cancel,
  });

  const displayState = state === 'dragging' ? 'dragging' : file ? 'ready' : state;

  return {
    inputId,
    inputRef,
    file,
    error,
    displayState,
    removalPending: remove.removalPending,
    removeBackgroundDisabled: remove.removeBackgroundDisabled,
    liveStatus: removeBackgroundLiveStatus(
      remove.removalPending,
      error,
      remove.progressLabel,
    ),
    errorTone: Boolean(error) && !remove.removalPending,
    clearSelection: fileApi.clearSelection,
    openPicker: fileApi.openPicker,
    onRemoveBackground: remove.onRemoveBackground,
    onInputChange: fileApi.onInputChange,
    onDragEnter: fileApi.onDragEnter,
    onDragLeave: fileApi.onDragLeave,
    onDragOver: fileApi.onDragOver,
    onDrop: fileApi.onDrop,
  };
}
