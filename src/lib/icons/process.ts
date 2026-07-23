import type { GenerateOptions } from './types';

import { Buffer } from 'node:buffer';

import sharp from 'sharp';

/**
 * Decode source, optionally greyscale, apply padding + background, optionally
 * round outer corners, return a square PNG buffer at `targetSize` suitable for
 * further encoding.
 *
 * Monochrome: when `monochrome` is true, apply Sharp `.greyscale()` to the
 * uploaded image content before compositing onto the background (alpha kept).
 *
 * Corner rounding: when `cornerRadius > 0`, composite an SVG rounded-rect mask
 * with blend `dest-in`. Radius px = round((cornerRadius / 100) * (min(w,h) / 2)).
 * SPEC §4.3.
 */
export async function renderIcon(
  input: Buffer,
  targetSize: number,
  options: Pick<
    GenerateOptions,
    'background' | 'padding' | 'cornerRadius' | 'monochrome'
  >,
): Promise<Buffer> {
  const padRatio = Math.min(Math.max(options.padding, 0), 50) / 100;
  const contentSize = Math.max(1, Math.round(targetSize * (1 - padRatio * 2)));
  const paddingPx = Math.floor((targetSize - contentSize) / 2);

  let pipeline = sharp(input, { density: 300 });
  if (options.monochrome) {
    pipeline = pipeline.greyscale();
  }
  const resized = await pipeline
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: parseBackground(options.background),
    })
    .png()
    .toBuffer();

  const canvasBg
    = options.background === 'transparent'
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : parseBackground(options.background);

  const png = await sharp({
    create: {
      width: targetSize,
      height: targetSize,
      channels: 4,
      background: canvasBg,
    },
  })
    .composite([{ input: resized, left: paddingPx, top: paddingPx }])
    .png()
    .toBuffer();

  return applyCornerRadius(png, targetSize, targetSize, options.cornerRadius);
}

/**
 * Decode source, optionally greyscale, apply padding + background, optionally
 * round outer corners, return a 1200×630 PNG suitable for Open Graph / social
 * previews. SPEC §4.5.
 */
export async function renderOgImage(
  input: Buffer,
  options: Pick<
    GenerateOptions,
    'background' | 'padding' | 'cornerRadius' | 'monochrome'
  >,
): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  const padRatio = Math.min(Math.max(options.padding, 0), 50) / 100;
  const innerW = Math.round(width * (1 - padRatio * 2));
  const innerH = Math.round(height * (1 - padRatio * 2));

  let pipeline = sharp(input, { density: 300 });
  if (options.monochrome) {
    pipeline = pipeline.greyscale();
  }
  const logo = await pipeline
    .resize(innerW, innerH, {
      fit: 'contain',
      background: parseBackground(options.background),
    })
    .png()
    .toBuffer();

  const meta = await sharp(logo).metadata();
  const left = Math.floor((width - (meta.width ?? innerW)) / 2);
  const top = Math.floor((height - (meta.height ?? innerH)) / 2);

  const png = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: parseBackground(options.background),
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toBuffer();

  return applyCornerRadius(png, width, height, options.cornerRadius);
}

/** Apply outer rounded-rect alpha mask; no-op when radius is 0. SPEC §4.3. */
async function applyCornerRadius(
  png: Buffer,
  width: number,
  height: number,
  cornerRadius: number,
): Promise<Buffer> {
  const clamped = Math.min(Math.max(cornerRadius, 0), 100);
  if (clamped === 0)
    return png;
  const r = Math.round((clamped / 100) * (Math.min(width, height) / 2));
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" rx="${r}" ry="${r}" fill="#fff"/>
    </svg>`,
  );
  return sharp(png)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * Preserve source SVG as `favicon.svg` for ZIP packaging.
 * Does not rasterize; lightly sanitizes for storage-in-ZIP only
 * (SPEC §2.1 / §4.8 / AC2). Caller must only invoke when source is SVG.
 * Corner radius and monochrome are not applied to SVG passthrough.
 */
export function passthroughFaviconSvg(input: Buffer): Buffer {
  const sanitized = sanitizeSvgForZip(input.toString('utf8'));
  return Buffer.from(sanitized, 'utf8');
}

/**
 * Strip executable / active content before storing SVG in the ZIP.
 * Not a full SVG security sanitizer — no eval, no DOM execution.
 */
function sanitizeSvgForZip(svg: string): string {
  return svg
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\shref\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '')
    .replace(/\sxlink:href\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '');
}

function parseBackground(value: GenerateOptions['background']) {
  if (value === 'transparent') {
    return { r: 0, g: 0, b: 0, alpha: 0 };
  }
  const hex = value.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const alpha = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, alpha };
}
