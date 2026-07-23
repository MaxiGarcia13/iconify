import type { PassThrough } from 'node:stream';

import type { AssetEntry } from './types';
import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import { createZipStream, zipToWebResponse } from './package';

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
      name: 'head.html',
      buffer: Buffer.from('<link rel="icon" href="/favicon.ico" />\n'),
      contentType: 'text/html; charset=utf-8',
    },
  ];
}

describe('createZipStream', () => {
  it('streams a ZIP whose membership matches the asset set (SPEC §4.6)', async () => {
    const assets = makeAssets();
    const zip = await streamToBuffer(createZipStream(assets));

    expect(zip.subarray(0, 2).toString('ascii')).toBe('PK');
    for (const asset of assets) {
      expect(zip.includes(Buffer.from(asset.name, 'utf8'))).toBe(true);
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
      'favicon-16x16.png,head.html',
    );

    const body = Buffer.from(await response.arrayBuffer());
    expect(body.subarray(0, 2).toString('ascii')).toBe('PK');
    expect(body.byteLength).toBeGreaterThan(0);
  });
});
