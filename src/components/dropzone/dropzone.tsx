import type { ChangeEvent, DragEvent } from 'react';
import type { DropzoneProps, DropzoneState } from './types';

import { useId, useRef, useState } from 'react';

import { validateSourceFile } from '@/lib/upload-constraints';
import { DropzoneClearBar } from './dropzone-clear-bar';
import { DropzoneStatus } from './dropzone-status';
import { DropzoneTarget } from './dropzone-target';

/**
 * Source upload dropzone — SPEC section 5.3.
 * States: idle · dragging · ready · error.
 */
export function Dropzone({ onFileChange, disabled = false }: DropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<DropzoneState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragDepthRef = useRef(0);

  function commitFile(next: File | null) {
    setFile(next);
    onFileChange?.(next);
  }

  function applyCandidate(candidate: File) {
    if (disabled)
      return;

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

  const displayState = state === 'dragging' ? 'dragging' : file ? 'ready' : state;

  return (
    <div className="flex flex-col gap-3">
      <DropzoneTarget
        inputId={inputId}
        inputRef={inputRef}
        disabled={disabled}
        displayState={displayState}
        file={file}
        error={error}
        onInputChange={onInputChange}
        onOpenPicker={openPicker}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      />

      {file
        ? (
            <DropzoneClearBar
              fileName={file.name}
              disabled={disabled}
              onClear={clearSelection}
            />
          )
        : null}

      <DropzoneStatus inputId={inputId} error={error} />
    </div>
  );
}
