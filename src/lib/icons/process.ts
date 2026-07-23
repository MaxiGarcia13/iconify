import type { GenerateOptions } from './types';

import { Buffer } from 'node:buffer';

import sharp from 'sharp';

/**
 * Decode source, apply padding + background, return a square PNG buffer
 * at `targetSize` suitable for further encoding.
 * SPEC §4.3.
 */
export async function renderIcon(
  input: Buffer,
  targetSize: number,
  options: Pick<GenerateOptions, 'background' | 'padding'>,
): Promise<Buffer> {
  const padRatio = Math.min(Math.max(options.padding, 0), 50) / 100;
  const contentSize = Math.max(1, Math.round(targetSize * (1 - padRatio * 2)));
  const paddingPx = Math.floor((targetSize - contentSize) / 2);

  const resized = await sharp(input, { density: 300 })
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

  return sharp({
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
}

/**
 * Decode source, apply padding + background, return a 1200×630 PNG
 * suitable for Open Graph / social previews.
 * SPEC §4.5.
 */
export async function renderOgImage(
  input: Buffer,
  options: Pick<GenerateOptions, 'background' | 'padding'>,
): Promise<Buffer> {
  const width = 1200;
  const height = 630;
  const padRatio = Math.min(Math.max(options.padding, 0), 50) / 100;
  const innerW = Math.round(width * (1 - padRatio * 2));
  const innerH = Math.round(height * (1 - padRatio * 2));

  const logo = await sharp(input, { density: 300 })
    .resize(innerW, innerH, {
      fit: 'contain',
      background: parseBackground(options.background),
    })
    .png()
    .toBuffer();

  const meta = await sharp(logo).metadata();
  const left = Math.floor((width - (meta.width ?? innerW)) / 2);
  const top = Math.floor((height - (meta.height ?? innerH)) / 2);

  return sharp({
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
}

/**
 * Preserve source SVG as `favicon.svg` for ZIP packaging.
 * Does not rasterize; lightly sanitizes for storage-in-ZIP only
 * (SPEC §2.1 / §4.8 / AC2). Caller must only invoke when source is SVG.
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
