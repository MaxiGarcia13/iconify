import type { PassThrough } from 'node:stream';

import type { AssetEntry } from './types';
import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import { solidPng } from '../../test/fixtures';
import { resolveMatrix } from './matrix';
import { createZipStream, processIconPackage, zipToWebResponse } from './package';

const EOCD_SIG = 0x06_05_4b_50;
const CD_SIG = 0x02_01_4b_50;

async function streamToBuffer(stream: PassThrough): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** List entry names from a ZIP central directory (no extra deps). */
function listZipEntryNames(zip: Buffer): string[] {
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('ZIP end of central directory not found');
  }

  const totalEntries = zip.readUInt16LE(eocd + 10);
  let offset = zip.readUInt32LE(eocd + 16);
  const names: string[] = [];

  for (let i = 0; i < totalEntries; i++) {
    if (zip.readUInt32LE(offset) !== CD_SIG) {
      throw new Error(`Invalid central directory signature at entry ${i}`);
    }
    const nameLen = zip.readUInt16LE(offset + 28);
    const extraLen = zip.readUInt16LE(offset + 30);
    const commentLen = zip.readUInt16LE(offset + 32);
    names.push(zip.subarray(offset + 46, offset + 46 + nameLen).toString('utf8'));
    offset += 46 + nameLen + extraLen + commentLen;
  }

  return names;
}

function makeAssets(): AssetEntry[] {
  return [
    {
      name: 'favicon-16x16.png',
      buffer: Buffer.from('png-16'),
      contentType: 'image/png',
    },
    {
      name: 'site.webmanifest',
      buffer: Buffer.from('{"name":"App"}'),
      contentType: 'application/manifest+json',
    },
    {
      name: 'head.html',
      buffer: Buffer.from('<link rel="icon" href="/favicon.ico" />\n'),
      contentType: 'text/html; charset=utf-8',
    },
  ];
}

const packageDefaults = {
  background: 'transparent' as const,
  padding: 0,
  presets: ['all' as const],
  appName: 'App',
  themeColor: '#ffffff',
  backgroundColor: '#ffffff',
};

describe('processIconPackage', () => {
  it('builds assets matching resolveMatrix for PNG (no SVG outputs)', async () => {
    const input = await solidPng();
    const result = await processIconPackage(input, packageDefaults, false);
    const expected = resolveMatrix(['all'], false).map((e) => e.name);

    expect(result.assets.map((a) => a.name)).toEqual(expected);
    expect(result.assets.some((a) => a.name.endsWith('.svg'))).toBe(false);
    expect(result.headHtml).toContain('favicon.ico');
    expect(result.manifestJson).toContain('"name":"App"');
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
      'favicon-16x16.png,site.webmanifest,head.html',
    );

    const body = Buffer.from(await response.arrayBuffer());
    expect(body.byteLength).toBeGreaterThan(0);
    expect(body.subarray(0, 2).toString('ascii')).toBe('PK');
    expect(listZipEntryNames(body)).toEqual(assets.map((a) => a.name));
  });
});
