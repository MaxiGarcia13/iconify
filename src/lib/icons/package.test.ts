import type { PassThrough } from 'node:stream';

import type { AssetEntry } from './types';
import { Buffer } from 'node:buffer';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { GENERATE_OPTION_DEFAULTS } from '@/lib/generate-defaults';
import {
  complexSvg,
  hugeDimensionSvg,
  solidJpeg,
  solidPng,
  solidSvg,
} from '@/test/fixtures';
import { listZipEntryNames } from '@/test/zip';
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
  monochrome: false,
  presets: ['all' as const],
};

describe('processIconPackage', () => {
  it('builds assets matching resolveMatrix for PNG (no SVG outputs)', async () => {
    const input = await solidPng();
    const result = await processIconPackage(input, packageDefaults, false);
    const expected = resolveMatrix(['all'], false).map((e) => e.name);

    expect(result.assets.map((a) => a.name)).toEqual(expected);
    expect(result.assets.some((a) => a.name.endsWith('.svg'))).toBe(false);
    expect(result.assets.map((a) => a.name)).not.toContain('original.png');
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

describe('omit SVG files when source is raster (M4 / SPEC §4.9 / AC1)', () => {
  it('jPEG + presets=all ZIP has no .svg entries', async () => {
    const input = await solidJpeg();
    const result = await processIconPackage(
      input,
      packageDefaults,
      false,
      'photo.jpg',
    );
    const names = result.assets.map((a) => a.name);

    expect(names).toEqual(resolveMatrix(['all'], false).map((e) => e.name));
    expect(names.some((n) => n.endsWith('.svg'))).toBe(false);
    expect(names).not.toContain('favicon.svg');
    expect(names).not.toContain('safari-pinned-tab.svg');
  });

  it('pNG favicon preset omits both SVG matrix rows', async () => {
    const input = await solidPng();
    const result = await processIconPackage(
      input,
      { ...packageDefaults, presets: ['favicon'] },
      false,
    );
    const names = result.assets.map((a) => a.name);

    expect(names).toEqual([
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
    ]);
  });
});

describe('large SVG performance sanity (M4)', () => {
  /** Generous CI budget — complex SVG full package should finish well under this. */
  const PACKAGE_BUDGET_MS = 15_000;
  /** Oversized SVG must hit Sharp’s pixel limit quickly (no hang). */
  const FAIL_FAST_BUDGET_MS = 2_000;

  it('complex multi-shape SVG completes presets=all under budget', async () => {
    const input = complexSvg(800, 1024);
    expect(input.byteLength).toBeLessThan(512 * 1024);

    const t0 = performance.now();
    const result = await processIconPackage(
      input,
      { ...packageDefaults, presets: ['all'] },
      true,
      'complex.svg',
    );
    const elapsed = performance.now() - t0;

    expect(elapsed).toBeLessThan(PACKAGE_BUDGET_MS);
    expect(result.assets.map((a) => a.name)).toEqual(
      resolveMatrix(['all'], true).map((e) => e.name),
    );
    expect(result.assets.some((a) => a.name === 'favicon.svg')).toBe(true);
  }, PACKAGE_BUDGET_MS + 5_000);

  it('huge-dimension SVG fails fast (Sharp pixel limit, no hang)', async () => {
    const input = hugeDimensionSvg(20_000);
    const t0 = performance.now();

    await expect(
      processIconPackage(
        input,
        { ...packageDefaults, presets: ['favicon'] },
        true,
        'huge.svg',
      ),
    ).rejects.toThrow(/pixel limit/i);

    expect(performance.now() - t0).toBeLessThan(FAIL_FAST_BUDGET_MS);
  }, FAIL_FAST_BUDGET_MS + 5_000);
});

describe('aC11 original preset package outputs', () => {
  it('presets=original alone yields only the upload basename at source size', async () => {
    const input = await solidPng(120, 80);
    const result = await processIconPackage(
      input,
      { ...packageDefaults, presets: ['original'] },
      false,
      'my-logo.png',
    );

    expect(result.assets.map((a) => a.name)).toEqual(['my-logo.png']);
    const meta = await sharp(result.assets[0]!.buffer).metadata();
    expect(meta.width).toBe(120);
    expect(meta.height).toBe(80);
  });

  it('presets=all omits original-size file', async () => {
    const input = await solidPng(90, 60);
    const result = await processIconPackage(
      input,
      packageDefaults,
      false,
      'logo.png',
    );
    const names = result.assets.map((a) => a.name);

    expect(names).not.toContain('logo.png');
    expect(names).not.toContain('original.png');
    expect(names).toEqual(resolveMatrix(['all'], false).map((e) => e.name));
  });

  it('combining original with all adds upload basename alongside §2.1–2.4', async () => {
    const input = await solidPng(100, 70);
    const result = await processIconPackage(
      input,
      { ...packageDefaults, presets: ['all', 'original'] },
      false,
      'brand.png',
    );
    const names = result.assets.map((a) => a.name);

    expect(names).toContain('brand.png');
    expect(names).toContain('og-image.png');
    expect(names).toContain('favicon.ico');
    expect(names).not.toContain('original.png');
  });

  it('disambiguates when upload basename collides with a matrix name', async () => {
    const input = await solidPng(64);
    const result = await processIconPackage(
      input,
      { ...packageDefaults, presets: ['favicon', 'original'] },
      false,
      'favicon.ico',
    );
    const names = result.assets.map((a) => a.name);

    expect(names).toContain('favicon.ico');
    expect(names).toContain('favicon-original.ico');
  });
});

describe('aC10 monochrome package outputs', () => {
  async function centerChroma(png: Buffer): Promise<number> {
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = Math.floor(info.width / 2);
    const y = Math.floor(info.height / 2);
    const idx = (y * info.width + x) * info.channels;
    const rgb = [data[idx]!, data[idx + 1]!, data[idx + 2]!] as const;
    return Math.max(...rgb) - Math.min(...rgb);
  }

  it('monochrome=true yields greyscale PNG + distinct ICO vs color (chroma ≈ 0)', async () => {
    const input = await solidPng();
    const result = await processIconPackage(
      input,
      {
        ...GENERATE_OPTION_DEFAULTS,
        presets: ['favicon'],
        monochrome: true,
      },
      false,
    );

    const png32 = result.assets.find((a) => a.name === 'favicon-32x32.png');
    const ico = result.assets.find((a) => a.name === 'favicon.ico');
    expect(png32).toBeDefined();
    expect(ico).toBeDefined();
    expect(await centerChroma(png32!.buffer)).toBe(0);

    const color = await processIconPackage(
      input,
      {
        ...GENERATE_OPTION_DEFAULTS,
        presets: ['favicon'],
        monochrome: false,
      },
      false,
    );
    const colorIco = color.assets.find((a) => a.name === 'favicon.ico')!;
    expect(Buffer.compare(ico!.buffer, colorIco.buffer)).not.toBe(0);
  });

  it('monochrome=false keeps source colors on PNG', async () => {
    const input = await solidPng();
    const result = await processIconPackage(
      input,
      {
        ...GENERATE_OPTION_DEFAULTS,
        presets: ['favicon'],
        monochrome: false,
      },
      false,
    );
    const png32 = result.assets.find((a) => a.name === 'favicon-32x32.png')!;
    expect(await centerChroma(png32.buffer)).toBeGreaterThan(0);
  });

  it('sVG passthrough keeps color fills when monochrome=true', async () => {
    const input = solidSvg();
    const result = await processIconPackage(
      input,
      {
        ...GENERATE_OPTION_DEFAULTS,
        presets: ['favicon'],
        monochrome: true,
      },
      true,
    );
    const svg = result.assets.find((a) => a.name === 'favicon.svg')!;
    expect(svg.buffer.toString('utf8')).toContain('fill="#0080ff"');
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
