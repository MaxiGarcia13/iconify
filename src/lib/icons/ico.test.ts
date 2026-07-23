import { describe, expect, it } from 'vitest';

import { solidPng } from '../../test/fixtures';
import { buildFaviconIco } from './ico';
import { ICO_SIZES } from './matrix';

describe('buildFaviconIco', () => {
  it('returns an ICO with 16, 32, and 48 px layers (SPEC §2.1 / §4.4 / AC5)', async () => {
    const input = await solidPng();

    const ico = await buildFaviconIco(input, {
      background: 'transparent',
      padding: 0,
      cornerRadius: 0,
      monochrome: false,
    });

    expect(ico.subarray(0, 2).readUInt16LE(0)).toBe(0); // reserved
    expect(ico.subarray(2, 4).readUInt16LE(0)).toBe(1); // type = ICO
    expect(ico.subarray(4, 6).readUInt16LE(0)).toBe(ICO_SIZES.length);

    const widths = ICO_SIZES.map((_, i) => {
      const entryOffset = 6 + i * 16;
      return ico[entryOffset]!;
    }).sort((a, b) => a - b);

    expect(widths).toEqual([...ICO_SIZES]);
  });
});
