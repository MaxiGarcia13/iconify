import type { PreviewBackground } from '../lib/preview';

import { useEffect, useRef, useState } from 'react';

import {
  drawPreviewApproximation,
  PREVIEW_DEBOUNCE_MS,
  PREVIEW_TARGETS,
} from '../lib/preview';

export interface PreviewGridProps {
  file: File | null;
  padding: number;
  /** `transparent` or last opaque hex — SPEC §5.3 / §5.5. */
  background: PreviewBackground;
}

interface LoadedSource {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

/**
 * Live preview grid — SPEC §5.3.
 * Client Canvas approximations; server Sharp output is authoritative.
 */
export function PreviewGrid({ file, padding, background }: PreviewGridProps) {
  const [source, setSource] = useState<LoadedSource | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [debounced, setDebounced] = useState({ padding, background });
  const bitmapRef = useRef<ImageBitmap | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced({ padding, background });
    }, PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [padding, background]);

  useEffect(() => {
    let cancelled = false;

    setLoadError(null);

    if (!file) {
      bitmapRef.current?.close();
      bitmapRef.current = null;
      setSource(null);
      return;
    }

    void (async () => {
      try {
        const next = await createImageBitmap(file);
        if (cancelled) {
          next.close();
          return;
        }
        bitmapRef.current?.close();
        bitmapRef.current = next;
        setSource({
          bitmap: next,
          width: next.width,
          height: next.height,
        });
      } catch {
        if (!cancelled) {
          bitmapRef.current?.close();
          bitmapRef.current = null;
          setSource(null);
          setLoadError('Could not decode image for preview');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      bitmapRef.current?.close();
      bitmapRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {!file
        ? (
            <p className="text-muted-foreground text-sm">
              Upload an image to see live previews
            </p>
          )
        : null}

      {loadError
        ? (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {loadError}
            </p>
          )
        : null}

      <ul
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        aria-label="Live icon previews"
      >
        {PREVIEW_TARGETS.map((target) => (
          <li key={target.id} className="flex min-w-0 flex-col gap-2">
            <PreviewTile
              label={target.label}
              width={target.width}
              height={target.height}
              source={source}
              padding={debounced.padding}
              background={debounced.background}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PreviewTileProps {
  label: string;
  width: number;
  height: number;
  source: LoadedSource | null;
  padding: number;
  background: PreviewBackground;
}

function PreviewTile({
  label,
  width,
  height,
  source,
  padding,
  background,
}: PreviewTileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isOg = width !== height;
  const displayMax = isOg ? 160 : 96;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx)
      return;

    ctx.clearRect(0, 0, width, height);

    if (!source)
      return;

    drawPreviewApproximation(
      ctx,
      source.bitmap,
      source.width,
      source.height,
      width,
      height,
      { padding, background },
    );
  }, [source, padding, background, width, height]);

  const scale = Math.min(displayMax / width, displayMax / height);
  const displayW = Math.max(1, Math.round(width * scale));
  const displayH = Math.max(1, Math.round(height * scale));

  return (
    <figure className="flex flex-col items-center gap-2">
      <div
        className={[
          'flex items-center justify-center border border-surface-border',
          background === 'transparent' ? 'preview-checker' : 'bg-muted/40',
        ].join(' ')}
        style={{ width: displayW + 16, height: displayH + 16 }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={width <= 32 ? 'pixelated' : undefined}
          style={{ width: displayW, height: displayH }}
          aria-label={`${label} preview`}
        />
      </div>
      <figcaption className="text-muted-foreground text-xs tabular-nums">
        {label}
      </figcaption>
    </figure>
  );
}
