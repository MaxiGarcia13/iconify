import { describe, expect, it } from 'vitest';

import { description, name } from '../../package.json';
import {
  SITE_OG_IMAGE_ALT,
  SITE_OG_IMAGE_HEIGHT,
  SITE_OG_IMAGE_PATH,
  SITE_OG_IMAGE_TYPE,
  SITE_OG_IMAGE_WIDTH,
  siteOpenGraph,
  siteTwitterCard,
} from './site-meta';

describe('site Open Graph (SPEC §5.6)', () => {
  const origin = 'http://localhost:4321';
  const og = siteOpenGraph(origin);

  it('includes the full §5.6 property set with absolute url and image', () => {
    expect(og).toEqual({
      type: 'website',
      locale: 'en_US',
      siteName: name,
      title: name,
      description,
      url: 'http://localhost:4321/',
      image: 'http://localhost:4321/og-image.png',
      imageWidth: 1200,
      imageHeight: 630,
      imageType: 'image/png',
      imageAlt: SITE_OG_IMAGE_ALT,
    });
  });

  it('uses public/og-image.png at 1200×630 PNG', () => {
    expect(SITE_OG_IMAGE_PATH).toBe('/og-image.png');
    expect(SITE_OG_IMAGE_WIDTH).toBe(1200);
    expect(SITE_OG_IMAGE_HEIGHT).toBe(630);
    expect(SITE_OG_IMAGE_TYPE).toBe('image/png');
  });

  it('keeps og:url and og:image absolute (not path-only)', () => {
    expect(og.url.startsWith('http')).toBe(true);
    expect(og.image.startsWith('http')).toBe(true);
    expect(og.image.endsWith(SITE_OG_IMAGE_PATH)).toBe(true);
  });
});

describe('site Twitter Card (SPEC §5.6)', () => {
  const origin = 'http://localhost:4321';
  const twitter = siteTwitterCard(origin);

  it('includes the full §5.6 name set with absolute image', () => {
    expect(twitter).toEqual({
      card: 'summary_large_image',
      title: name,
      description,
      image: 'http://localhost:4321/og-image.png',
      imageAlt: SITE_OG_IMAGE_ALT,
    });
  });

  it('shares image alt with og:image:alt', () => {
    expect(twitter.imageAlt).toBe(siteOpenGraph(origin).imageAlt);
  });

  it('keeps twitter:image absolute (not path-only)', () => {
    expect(twitter.image.startsWith('http')).toBe(true);
    expect(twitter.image.endsWith(SITE_OG_IMAGE_PATH)).toBe(true);
  });
});
