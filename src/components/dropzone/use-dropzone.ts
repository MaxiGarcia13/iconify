import type { ChangeEvent, DragEvent, RefObject } from 'react';
import type { DropzoneState } from './types';

import { useId, useRef, useState } from 'react';

import {
  isRemoveBackgroundDisabled,
  removeBackgroundLiveStatus,
} from '@/domain/remove-background-ui';
import { validateSourceFile } from '@/domain/upload-constraints';
import { createRemoveBackgroundRunner } from '@/services/remove-background-runner';

export interface UseDropzoneOptions {
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
  previewPending?: boolean;
}

export interface UseDropzoneResult {
  inputId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  file: File | null;
  error: string | null;
  displayState: DropzoneState;
  removalPending: boolean;
  removeBackgroundDisabled: boolean;
  liveStatus: string;
  errorTone: boolean;
  clearSelection: () => void;
  openPicker: () => void;
  onRemoveBackground: () => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

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
  const [removalPending, setRemovalPending] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const dragDepthRef = useRef(0);

  const runnerRef = useRef(createRemoveBackgroundRunner({
    onPending: setRemovalPending,
    onProgress: setProgressLabel,
    onResult: (result) => {
      if (result.ok) {
        setError(null);
        return;
      }
      setError(result.message);
    },
  }));

  function commitFile(next: File | null) {
    setFile(next);
    onFileChange?.(next);
  }

  function applyCandidate(candidate: File) {
    if (disabled)
      return;

    runnerRef.current.cancel();

    const result = validateSourceFile(candidate);
    if (!result.ok) {
      setState('error');
      setError(result.message);
      return;
    }

    setError(null);
    setState('ready');
    commitFile(candidate);
  }

  function clearSelection() {
    if (disabled)
      return;

    runnerRef.current.cancel();
    setError(null);
    setState('idle');
    commitFile(null);
    if (inputRef.current)
      inputRef.current.value = '';
  }

  function openPicker() {
    if (disabled)
      return;
    inputRef.current?.click();
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected)
      return;
    applyCandidate(selected);
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled)
      return;
    dragDepthRef.current += 1;
    setState((prev) => (prev === 'ready' ? prev : 'dragging'));
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled)
      return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0)
      setState(file ? 'ready' : error ? 'error' : 'idle');
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    if (disabled) {
      setState(file ? 'ready' : error ? 'error' : 'idle');
      return;
    }
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) {
      setState(file ? 'ready' : error ? 'error' : 'idle');
      return;
    }
    applyCandidate(dropped);
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

  const displayState = state === 'dragging' ? 'dragging' : file ? 'ready' : state;
  const removeBackgroundDisabled = isRemoveBackgroundDisabled({
    file,
    removalPending,
    generatePending: disabled,
    previewPending,
  });

  return {
    inputId,
    inputRef,
    file,
    error,
    displayState,
    removalPending,
    removeBackgroundDisabled,
    liveStatus: removeBackgroundLiveStatus(
      removalPending,
      error,
      progressLabel,
    ),
    errorTone: Boolean(error) && !removalPending,
    clearSelection,
    openPicker,
    onRemoveBackground,
    onInputChange,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}
