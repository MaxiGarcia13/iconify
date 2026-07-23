import { describe, expect, it } from 'vitest';

import config from '../../astro.config.js';
import { description, name } from '../../package.json';
import { absoluteSiteUrl, siteCanonicalUrl } from './site';

describe('astro site (SPEC §5.6)', () => {
  it('exports an absolute http(s) origin for social / canonical URLs', () => {
    expect(typeof config.site).toBe('string');

    const url = new URL(config.site as string);
    expect(url.protocol === 'http:' || url.protocol === 'https:').toBe(true);
    expect(url.pathname === '/' || url.pathname === '').toBe(true);
  });
});

describe('core SEO URLs (SPEC §5.6)', () => {
  const origin = 'http://localhost:4321';

  it('absoluteSiteUrl joins pathname to the configured origin', () => {
    expect(absoluteSiteUrl('/', origin)).toBe('http://localhost:4321/');
    expect(absoluteSiteUrl('/og-image.png', origin)).toBe(
      'http://localhost:4321/og-image.png',
    );
  });

  it('siteCanonicalUrl is the absolute URL of /', () => {
    expect(siteCanonicalUrl(origin)).toBe('http://localhost:4321/');
    expect(siteCanonicalUrl(config.site as string)).toBe(
      absoluteSiteUrl('/', config.site as string),
    );
  });

  it('title and description come from package.json', () => {
    expect(name).toBe('iconify');
    expect(description.length).toBeGreaterThan(0);
  });
});
