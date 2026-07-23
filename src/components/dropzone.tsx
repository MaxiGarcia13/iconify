import type { ChangeEvent, DragEvent } from 'react';
import { useId, useRef, useState } from 'react';

import {
  DROPZONE_ACCEPT,
  MAX_UPLOAD_BYTES,
  normalizeMime,
  validateSourceFile,
} from '../lib/upload-constraints';

export interface DropzoneProps {
  /** Selected file (or `null` when cleared / none). SPEC §5.3. */
  onFileChange?: (file: File | null) => void;
}

type DropzoneState = 'idle' | 'dragging' | 'ready' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Source upload dropzone — SPEC §5.3.
 * States: idle · dragging · ready · error.
 */
export function Dropzone({ onFileChange }: DropzoneProps) {
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
    setError(null);
    setState('idle');
    commitFile(null);
    if (inputRef.current)
      inputRef.current.value = '';
  }

  function openPicker() {
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
    dragDepthRef.current += 1;
    setState((prev) => (prev === 'ready' ? prev : 'dragging'));
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) {
      setState(file ? 'ready' : error ? 'error' : 'idle');
      return;
    }
    applyCandidate(dropped);
  }

  const displayState = state === 'dragging' ? 'dragging' : file ? 'ready' : state;
  const mimeLabel = file ? (normalizeMime(file.type) || 'unknown') : null;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={DROPZONE_ACCEPT}
        onChange={onInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <button
        type="button"
        aria-controls={inputId}
        aria-describedby={error ? `${inputId}-error` : undefined}
        data-state={displayState}
        className={[
          'flex w-full min-h-40 flex-col items-center justify-center gap-2 border border-dashed px-6 py-8 text-center transition-colors',
          'border-surface-border bg-muted/40 text-foreground',
          'hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          displayState === 'dragging' ? 'border-accent bg-muted' : '',
          displayState === 'error' ? 'border-red-500/70' : '',
          displayState === 'ready' ? 'border-solid' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={openPicker}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {displayState === 'ready' && file
          ? (
              <>
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-muted-foreground text-sm">
                  {formatBytes(file.size)}
                  {' · '}
                  {mimeLabel}
                </span>
                <span className="text-muted-foreground text-xs">
                  Click to replace, or drop another file
                </span>
              </>
            )
          : (
              <>
                <span className="text-sm font-medium">
                  {displayState === 'dragging'
                    ? 'Drop image to upload'
                    : 'Drop SVG, PNG, or JPG here'}
                </span>
                <span className="text-muted-foreground text-sm">
                  or click to browse · max
                  {' '}
                  {formatBytes(MAX_UPLOAD_BYTES)}
                </span>
              </>
            )}
      </button>

      {file
        ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground truncate">
                Ready:
                {' '}
                {file.name}
              </span>
              <button
                type="button"
                className="text-foreground focus-visible:outline-accent shrink-0 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={clearSelection}
              >
                Clear
              </button>
            </div>
          )
        : null}

      <p
        id={`${inputId}-error`}
        role="status"
        aria-live="polite"
        className={error ? 'text-sm text-red-600 dark:text-red-400' : 'sr-only'}
      >
        {error ?? ''}
      </p>
    </div>
  );
}
