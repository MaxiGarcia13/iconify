/**
 * Client live-preview helpers — SPEC §5.3 Preview Grid.
 * Geometry mirrors Sharp `renderIcon` / `renderOgImage` (server remains authoritative).
 */

/** Debounce re-render on slider input — SPEC §5.3 (≥ 50 ms). */
export const PREVIEW_DEBOUNCE_MS = 50;

export interface PreviewTarget {
  id: string;
  /** Short label shown under the tile */
  label: string;
  width: number;
  height: number;
}

/** Approximate preview sizes — SPEC §5.3. */
export const PREVIEW_TARGETS = [
  { id: 'favicon-16', label: '16×16', width: 16, height: 16 },
  { id: 'favicon-32', label: '32×32', width: 32, height: 32 },
  { id: 'apple-180', label: '180×180', width: 180, height: 180 },
  { id: 'android-192', label: '192×192', width: 192, height: 192 },
  { id: 'android-512', label: '512×512', width: 512, height: 512 },
  { id: 'og', label: '1200×630', width: 1200, height: 630 },
] as const satisfies readonly PreviewTarget[];

export type PreviewTargetId = (typeof PREVIEW_TARGETS)[number]['id'];

export interface ContentBox {
  /** Inner content width after padding % */
  innerW: number;
  /** Inner content height after padding % */
  innerH: number;
  /** Offset from canvas left to content box */
  left: number;
  /** Offset from canvas top to content box */
  top: number;
}

/**
 * Padding inset box matching Sharp pipeline pad ratio
 * (`padding` 0–50 → pad on each side as % of canvas).
 */
export function contentBox(
  width: number,
  height: number,
  padding: number,
): ContentBox {
  const padRatio = Math.min(Math.max(padding, 0), 50) / 100;
  const innerW = Math.max(1, Math.round(width * (1 - padRatio * 2)));
  const innerH = Math.max(1, Math.round(height * (1 - padRatio * 2)));
  const left = Math.floor((width - innerW) / 2);
  const top = Math.floor((height - innerH) / 2);
  return { innerW, innerH, left, top };
}

export interface ContainRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/** CSS `object-fit: contain` destination rect inside a box. */
export function containDrawRect(
  sourceWidth: number,
  sourceHeight: number,
  boxW: number,
  boxH: number,
): ContainRect {
  if (sourceWidth <= 0 || sourceHeight <= 0 || boxW <= 0 || boxH <= 0) {
    return { dx: 0, dy: 0, dw: Math.max(1, boxW), dh: Math.max(1, boxH) };
  }

  const scale = Math.min(boxW / sourceWidth, boxH / sourceHeight);
  const dw = Math.max(1, Math.round(sourceWidth * scale));
  const dh = Math.max(1, Math.round(sourceHeight * scale));
  const dx = Math.floor((boxW - dw) / 2);
  const dy = Math.floor((boxH - dh) / 2);
  return { dx, dy, dw, dh };
}

export type PreviewBackground = 'transparent' | `#${string}`;

/** Map settings fields → preview / API background value. */
export function previewBackgroundFromSettings(state: {
  transparent: boolean;
  backgroundHex: `#${string}`;
}): PreviewBackground {
  return state.transparent ? 'transparent' : state.backgroundHex;
}

/**
 * Draw a client approximation of padded icon / OG output onto a canvas.
 * Uses the same padding % and contain-fit model as Sharp (SPEC §4.3 / §4.5).
 */
export function drawPreviewApproximation(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  options: { padding: number; background: PreviewBackground },
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (options.background !== 'transparent') {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  const box = contentBox(canvasWidth, canvasHeight, options.padding);
  const draw = containDrawRect(
    sourceWidth,
    sourceHeight,
    box.innerW,
    box.innerH,
  );

  ctx.drawImage(
    source,
    0,
    0,
    sourceWidth,
    sourceHeight,
    box.left + draw.dx,
    box.top + draw.dy,
    draw.dw,
    draw.dh,
  );
}
