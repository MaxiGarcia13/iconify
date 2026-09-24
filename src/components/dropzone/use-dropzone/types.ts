import type { ChangeEvent, DragEvent, RefObject } from 'react';

import type { DropzoneState } from '../types';

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
