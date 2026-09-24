export interface DropzoneProps {
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
}

export type DropzoneState = 'idle' | 'dragging' | 'ready' | 'error';
