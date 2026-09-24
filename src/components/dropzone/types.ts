export interface DropzoneProps {
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
  /** Object URL from the live preview response. */
  previewUrl?: string | null;
  /** True while a preview request is in flight. */
  previewPending?: boolean;
}

export type DropzoneState = 'idle' | 'dragging' | 'ready' | 'error';
