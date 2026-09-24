import type { DropzoneProps } from './types';

import { DropzoneClearBar } from './dropzone-clear-bar';
import { DropzoneStatus } from './dropzone-status';
import { DropzoneTarget } from './dropzone-target';
import { useDropzone } from './use-dropzone';

export function Dropzone({
  onFileChange,
  disabled = false,
  previewUrl = null,
  previewPending = false,
}: DropzoneProps) {
  const dz = useDropzone({
    onFileChange,
    disabled,
    previewPending,
  });

  return (
    <div className="flex flex-col gap-3">
      <DropzoneTarget
        inputId={dz.inputId}
        inputRef={dz.inputRef}
        disabled={disabled}
        displayState={dz.displayState}
        file={dz.file}
        error={dz.error}
        previewUrl={previewUrl}
        previewPending={previewPending}
        onInputChange={dz.onInputChange}
        onOpenPicker={dz.openPicker}
        onDragEnter={dz.onDragEnter}
        onDragLeave={dz.onDragLeave}
        onDragOver={dz.onDragOver}
        onDrop={dz.onDrop}
      />

      {dz.file
        ? (
            <DropzoneClearBar
              fileName={dz.file.name}
              disabled={disabled}
              removeBackgroundDisabled={dz.removeBackgroundDisabled}
              onClear={dz.clearSelection}
              onRemoveBackground={dz.onRemoveBackground}
            />
          )
        : null}

      <DropzoneStatus
        inputId={dz.inputId}
        liveStatus={dz.liveStatus}
        errorTone={dz.errorTone}
      />
    </div>
  );
}
