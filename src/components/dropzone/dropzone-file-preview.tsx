import { normalizeMime } from '../../lib/upload-constraints';

import { formatBytes } from './format-bytes';

export interface DropzoneFilePreviewProps {
  file: File;
}

/** Ready-state file summary inside the drop target. */
export function DropzoneFilePreview({ file }: DropzoneFilePreviewProps) {
  const mimeLabel = normalizeMime(file.type) || 'unknown';

  return (
    <span className="flex max-w-full flex-col items-center gap-2">
      <span className="max-w-full text-sm font-medium break-all">
        {file.name}
      </span>
      <span className="text-sm text-muted-foreground">
        {`${formatBytes(file.size)} · ${mimeLabel}`}
      </span>
      <span className="text-xs text-muted-foreground">
        Tap to replace, or drop another file
      </span>
    </span>
  );
}
