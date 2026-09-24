export interface DropzoneProps {
  onFileChange?: (file: File | null) => void;
  /** Dropzone action: remove background from the current raster source. */
  onRemoveBackground?: () => void;
  disabled?: boolean;
  /** When true, disables only the Remove background control. */
  removeBackgroundDisabled?: boolean;
  /** Object URL from the live preview response. */
  previewUrl?: string | null;
  /** True while a preview request is in flight. */
  previewPending?: boolean;
}

export type DropzoneState = 'idle' | 'dragging' | 'ready' | 'error';
