import type { ChangeEvent, DragEvent, RefObject } from 'react';

import { DROPZONE_ACCEPT } from '../../lib/upload-constraints';

import { DropzoneFilePreview } from './dropzone-file-preview';
import { DropzonePrompt } from './dropzone-prompt';
import type { DropzoneState } from './types';

export interface DropzoneTargetProps {
  inputId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  displayState: DropzoneState;
  file: File | null;
  error: string | null;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenPicker: () => void;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

/** Hidden file input + dashed drop / browse target. */
export function DropzoneTarget({
  inputId,
  inputRef,
  disabled,
  displayState,
  file,
  error,
  onInputChange,
  onOpenPicker,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: DropzoneTargetProps) {
  const buttonClassName = [
    'flex w-full min-h-36 min-w-0 flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center transition-colors sm:min-h-40 sm:px-6 sm:py-8',
    'border-surface-border bg-muted/40 text-foreground',
    'hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-surface-border',
    'touch-manipulation',
    displayState === 'dragging' ? 'border-accent bg-muted' : '',
    displayState === 'error' ? 'border-red-500/70' : '',
    displayState === 'ready' ? 'border-solid' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={DROPZONE_ACCEPT}
        onChange={onInputChange}
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
      />

      <button
        type="button"
        disabled={disabled}
        aria-controls={inputId}
        aria-describedby={error ? `${inputId}-error` : undefined}
        data-state={displayState}
        className={buttonClassName}
        onClick={onOpenPicker}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {file && displayState === 'ready'
          ? <DropzoneFilePreview file={file} />
          : <DropzonePrompt displayState={displayState} />}
      </button>
    </>
  );
}
