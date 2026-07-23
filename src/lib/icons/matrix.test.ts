import { describe, expect, it } from 'vitest';

import { ASSET_MATRIX, resolveMatrix } from './matrix';

describe('resolveMatrix SVG omission (SPEC §2.1 / §4.9 / AC1)', () => {
  const svgOnlyNames = ASSET_MATRIX
    .filter((e) => e.svgSourceOnly)
    .map((e) => e.name);

  it('marks favicon.svg and safari-pinned-tab.svg as SVG-source-only', () => {
    expect(svgOnlyNames).toEqual([
      'favicon.svg',
      'safari-pinned-tab.svg',
    ]);
  });

  it('drops SVG-only rows when source is raster (PNG/JPEG)', () => {
    const names = resolveMatrix(['all'], false).map((e) => e.name);

    expect(names.some((n) => n.endsWith('.svg'))).toBe(false);
    expect(names).not.toContain('favicon.svg');
    expect(names).not.toContain('safari-pinned-tab.svg');
    expect(names).toContain('favicon.ico');
    expect(names).toContain('og-image.png');
  });

  it('includes SVG-only rows when source is SVG (AC2)', () => {
    const names = resolveMatrix(['favicon'], true).map((e) => e.name);

    expect(names).toContain('favicon.svg');
    expect(names).toContain('safari-pinned-tab.svg');
    expect(names).toContain('favicon.ico');
  });

  it('favicon preset alone still omits SVG rows for raster', () => {
    const names = resolveMatrix(['favicon'], false).map((e) => e.name);

    expect(names).toEqual([
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
    ]);
  });
});
