import { cn } from '@maxigarcia/js-utils';

import { normalizeMime } from '@/domain/upload-constraints';

import { formatBytes } from './format-bytes';

export interface DropzoneFilePreviewProps {
  file: File;
  previewUrl?: string | null;
  previewPending?: boolean;
}

export function DropzoneFilePreview({
  file,
  previewUrl = null,
  previewPending = false,
}: DropzoneFilePreviewProps) {
  const mimeLabel = normalizeMime(file.type) || 'unknown';
  const showFrame = Boolean(previewUrl) || previewPending;

  return (
    <span className="flex max-w-full flex-col items-center gap-2">
      {showFrame
        ? (
            <span
              className="relative size-28 max-w-full"
              aria-busy={previewPending || undefined}
            >
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
              {previewPending
                ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute inset-0 animate-pulse rounded-sm',
                        'bg-foreground/10',
                      )}
                    />
                  )
                : null}
              {previewPending
                ? (
                    <span className="sr-only">Updating preview…</span>
                  )
                : null}
            </span>
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
