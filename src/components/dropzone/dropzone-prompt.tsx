import type { DropzoneState } from './types';

import { MAX_UPLOAD_BYTES } from '../../lib/upload-constraints';
import { formatBytes } from './format-bytes';

export interface DropzonePromptProps {
  displayState: DropzoneState;
}

/** Idle / dragging copy inside the drop target. */
export function DropzonePrompt({ displayState }: DropzonePromptProps) {
  const label = displayState === 'dragging'
    ? 'Drop image to upload'
    : 'Drop SVG, PNG, or JPG here';

  return (
    <span className="flex max-w-full flex-col items-center gap-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">
        {`or tap to browse · max ${formatBytes(MAX_UPLOAD_BYTES)}`}
      </span>
    </span>
  );
}
