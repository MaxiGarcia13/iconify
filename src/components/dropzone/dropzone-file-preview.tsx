import { normalizeMime } from '@/domain/upload-constraints';

import { formatBytes } from './format-bytes';

export interface DropzoneFilePreviewProps {
  file: File;
  previewUrl?: string | null;
}

export function DropzoneFilePreview({
  file,
  previewUrl = null,
}: DropzoneFilePreviewProps) {
  const mimeLabel = normalizeMime(file.type) || 'unknown';

  return (
    <span className="flex max-w-full flex-col items-center gap-2">
      {previewUrl
        ? (
            <img
              src={previewUrl}
              alt={`Processed preview of ${file.name}`}
              width={128}
              height={128}
              className="size-28 max-w-full object-contain"
              draggable={false}
            />
          )
        : null}
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
