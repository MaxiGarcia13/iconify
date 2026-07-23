import { describe, expect, it } from 'vitest';

import { SITE_ICON_LINKS } from './site-icons';

/** SPEC §5.6 favicon / touch icon file → expected link attrs. */
const SPEC_SITE_ICONS = [
  { href: '/favicon.ico', rel: 'icon', sizes: 'any' },
  {
    href: '/favicon-16x16.png',
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
  },
  {
    href: '/favicon-32x32.png',
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
  },
  {
    href: '/apple-touch-icon.png',
    rel: 'apple-touch-icon',
    sizes: '180x180',
  },
  {
    href: '/apple-touch-icon-152x152.png',
    rel: 'apple-touch-icon',
    sizes: '152x152',
  },
  {
    href: '/apple-touch-icon-167x167.png',
    rel: 'apple-touch-icon',
    sizes: '167x167',
  },
  {
    href: '/apple-touch-icon-180x180.png',
    rel: 'apple-touch-icon',
    sizes: '180x180',
  },
  {
    href: '/android-chrome-192x192.png',
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
  },
  {
    href: '/android-chrome-512x512.png',
    rel: 'icon',
    type: 'image/png',
    sizes: '512x512',
  },
] as const;

describe('site icon links (SPEC §5.6)', () => {
  it('wires every public/ favicon, Apple Touch, and Android Chrome icon', () => {
    expect(SITE_ICON_LINKS).toHaveLength(SPEC_SITE_ICONS.length);

    for (const [index, expected] of SPEC_SITE_ICONS.entries()) {
      const actual = SITE_ICON_LINKS[index];
      expect(actual).toMatchObject(expected);
    }
  });
});
