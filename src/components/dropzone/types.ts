export interface DropzoneProps {
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
  /** Object URL from `POST /api/v1/preview` (SPEC §5.3.1). */
  previewUrl?: string | null;
}

export type DropzoneState = 'idle' | 'dragging' | 'ready' | 'error';
