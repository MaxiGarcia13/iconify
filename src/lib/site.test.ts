import { describe, expect, it } from 'vitest';

import config from '../../astro.config.js';

describe('astro site (SPEC §5.6)', () => {
  it('exports an absolute http(s) origin for social / canonical URLs', () => {
    expect(typeof config.site).toBe('string');

    const url = new URL(config.site as string);
    expect(url.protocol === 'http:' || url.protocol === 'https:').toBe(true);
    expect(url.pathname === '/' || url.pathname === '').toBe(true);
  });
});
