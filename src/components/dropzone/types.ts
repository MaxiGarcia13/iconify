export interface DropzoneProps {
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
  /** Object URL from `POST /api/v1/preview` (SPEC §5.3.1). */
  previewUrl?: string | null;
  /** True while a preview request is in flight. */
  previewPending?: boolean;
}

export type DropzoneState = 'idle' | 'dragging' | 'ready' | 'error';
