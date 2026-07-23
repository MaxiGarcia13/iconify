export interface DropzoneProps {
  /** Selected file (or `null` when cleared / none). SPEC section 5.3. */
  onFileChange?: (file: File | null) => void;
  /** When true, reject interaction (e.g. generate in flight). SPEC section 5.2 step 5. */
  disabled?: boolean;
}

export type DropzoneState = 'idle' | 'dragging' | 'ready' | 'error';
