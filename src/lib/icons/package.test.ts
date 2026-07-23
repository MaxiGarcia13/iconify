import type { PassThrough } from 'node:stream';

import type { AssetEntry } from './types';
import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import { solidPng } from '../../test/fixtures';
import { listZipEntryNames } from '../../test/zip';
import { resolveMatrix } from './matrix';
import { createZipStream, processIconPackage, zipToWebResponse } from './package';

async function streamToBuffer(stream: PassThrough): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function makeAssets(): AssetEntry[] {
  return [
    {
      name: 'favicon-16x16.png',
      buffer: Buffer.from('png-16'),
      contentType: 'image/png',
    },
    {
      name: 'android-chrome-192x192.png',
      buffer: Buffer.from('png-192'),
      contentType: 'image/png',
    },
    {
      name: 'og-image.png',
      buffer: Buffer.from('png-og'),
      contentType: 'image/png',
    },
  ];
}

const packageDefaults = {
  background: 'transparent' as const,
  padding: 0,
  cornerRadius: 0,
  presets: ['all' as const],
};

describe('processIconPackage', () => {
  it('builds assets matching resolveMatrix for PNG (no SVG outputs)', async () => {
    const input = await solidPng();
    const result = await processIconPackage(input, packageDefaults, false);
    const expected = resolveMatrix(['all'], false).map((e) => e.name);

    expect(result.assets.map((a) => a.name)).toEqual(expected);
    expect(result.assets.some((a) => a.name.endsWith('.svg'))).toBe(false);
  });

  it('includes favicon.svg when source is SVG', async () => {
    const input = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0af"/></svg>',
      'utf8',
    );
    const result = await processIconPackage(
      input,
      { ...packageDefaults, presets: ['favicon'] },
      true,
    );

    expect(result.assets.map((a) => a.name)).toContain('favicon.svg');
    expect(result.assets.map((a) => a.name)).toContain('safari-pinned-tab.svg');
  });
});

describe('createZipStream', () => {
  it('streams a non-empty ZIP whose membership matches the asset set (SPEC §4.6)', async () => {
    const assets = makeAssets();
    const zip = await streamToBuffer(createZipStream(assets));

    expect(zip.byteLength).toBeGreaterThan(0);
    expect(zip.subarray(0, 2).toString('ascii')).toBe('PK');

    const names = listZipEntryNames(zip);
    expect(names).toEqual(assets.map((a) => a.name));
  });

  it('does not produce a partial archive when given a full asset set', async () => {
    const assets = makeAssets();
    const zip = await streamToBuffer(createZipStream(assets));
    const names = listZipEntryNames(zip);

    expect(names).toHaveLength(assets.length);
    for (const asset of assets) {
      expect(names).toContain(asset.name);
    }
  });
});

describe('zipToWebResponse', () => {
  it('returns a 200 ZIP Response with SPEC §4.6 headers', async () => {
    const assets = makeAssets();
    const response = zipToWebResponse(assets);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="iconify-package.zip"',
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Iconify-Assets')).toBe(
      'favicon-16x16.png,android-chrome-192x192.png,og-image.png',
    );

    const body = Buffer.from(await response.arrayBuffer());
    expect(body.byteLength).toBeGreaterThan(0);
    expect(body.subarray(0, 2).toString('ascii')).toBe('PK');
    expect(listZipEntryNames(body)).toEqual(assets.map((a) => a.name));
  });
});
