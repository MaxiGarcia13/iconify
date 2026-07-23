import type { Buffer } from 'node:buffer';
import type { MatrixEntry } from './matrix';

import type { AssetEntry, GenerateOptions, ProcessResult } from './types';
import { PassThrough, Readable } from 'node:stream';

import archiver from 'archiver';

import { buildFaviconIco } from './ico';
import { originalZipName, resolveMatrix } from './matrix';
import {
  passthroughFaviconSvg,
  renderIcon,
  renderOgImage,
  renderOriginal,
} from './process';

/**
 * Build every asset buffer for the requested presets, then return them for ZIP.
 * Never starts packaging until all buffers succeed (SPEC §4.8).
 * `sourceFilename` sets the §2.5 original-size ZIP entry name (upload basename).
 */
export async function processIconPackage(
  input: Buffer,
  options: GenerateOptions,
  sourceIsSvg: boolean,
  sourceFilename = 'original.png',
): Promise<ProcessResult> {
  const entries = resolveMatrix(options.presets, sourceIsSvg);
  const assets: AssetEntry[] = [];
  const taken = new Set<string>();

  for (const entry of entries) {
    const buffer = await renderMatrixEntry(input, entry, options, sourceIsSvg);
    const name = entry.preset === 'original'
      ? originalZipName(sourceFilename, taken)
      : entry.name;
    taken.add(name);
    assets.push({
      name,
      buffer,
      contentType: entry.contentType,
    });
  }

  return { assets };
}

async function renderMatrixEntry(
  input: Buffer,
  entry: MatrixEntry,
  options: GenerateOptions,
  sourceIsSvg: boolean,
): Promise<Buffer> {
  switch (entry.format) {
    case 'ico':
      return buildFaviconIco(input, options);
    case 'png': {
      if (entry.size.kind === 'rect')
        return renderOgImage(input, options);
      if (entry.size.kind === 'square')
        return renderIcon(input, entry.size.px, options);
      if (entry.size.kind === 'native')
        return renderOriginal(input, options);
      throw new Error(`Unsupported PNG size for ${entry.name}`);
    }
    case 'svg': {
      if (!sourceIsSvg)
        throw new Error(`SVG asset ${entry.name} requested for non-SVG source`);
      return passthroughFaviconSvg(input);
    }
    default: {
      const _exhaustive: never = entry.format;
      throw new Error(`Unknown asset format: ${_exhaustive}`);
    }
  }
}

/**
 * Pipe asset buffers into an archiver ZIP stream.
 * Callers must build all buffers before invoking (no partial ZIP on failure).
 * SPEC §4.6.
 */
export function createZipStream(assets: AssetEntry[]): PassThrough {
  const output = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => output.destroy(err));
  archive.pipe(output);

  for (const asset of assets) {
    archive.append(asset.buffer, { name: asset.name });
  }

  void archive.finalize();
  return output;
}

/** Astro / Web Response helper — SPEC §4.6. */
export function zipToWebResponse(
  assets: AssetEntry[],
  filename = 'iconify-package.zip',
): Response {
  const stream = createZipStream(assets);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Iconify-Assets': assets.map((a) => a.name).join(','),
    },
  });
}
