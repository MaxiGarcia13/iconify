import type { ChangeEvent, Dispatch, DragEvent, RefObject, SetStateAction } from 'react';

import type { DropzoneState } from '../types';

import { useRef } from 'react';
import { validateSourceFile } from '@/domain/upload-constraints';

export interface UseDropzoneFileOptions {
  disabled: boolean;
  file: File | null;
  error: string | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setState: Dispatch<SetStateAction<DropzoneState>>;
  onFileChange?: (file: File | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Cancel in-flight work before clear / replace. */
  onInterrupt: () => void;
}

export function useDropzoneFile({
  disabled,
  file,
  error,
  setFile,
  setError,
  setState,
  onFileChange,
  inputRef,
  onInterrupt,
}: UseDropzoneFileOptions) {
  const dragDepthRef = useRef(0);

  function commitFile(next: File | null) {
    setFile(next);
    onFileChange?.(next);
  }

  function applyCandidate(candidate: File) {
    if (disabled)
      return;

    onInterrupt();

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

    onInterrupt();
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

  return {
    clearSelection,
    openPicker,
    onInputChange,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}
