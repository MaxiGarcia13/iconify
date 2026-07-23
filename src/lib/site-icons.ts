/**
 * Document-head icon links for the product page (SPEC §5.6).
 * Paths are files already shipped under `public/` — do not invent filenames.
 */

export interface SiteIconLink {
  rel: 'icon' | 'apple-touch-icon';
  href: `/${string}`;
  sizes: string;
  type?: 'image/png';
}

/** Favicon / Apple Touch / Android Chrome links — SPEC §5.6 table order. */
export const SITE_ICON_LINKS: readonly SiteIconLink[] = [
  { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon-16x16.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon-32x32.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/apple-touch-icon.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '152x152',
    href: '/apple-touch-icon-152x152.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '167x167',
    href: '/apple-touch-icon-167x167.png',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/apple-touch-icon-180x180.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
    href: '/android-chrome-192x192.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '512x512',
    href: '/android-chrome-512x512.png',
  },
] as const;
