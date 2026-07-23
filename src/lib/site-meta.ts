/**
 * Document-head Open Graph tags for the product page (SPEC §5.6).
 */

import { description, name } from '../../package.json';
import { absoluteSiteUrl, siteCanonicalUrl } from './site';

/** Path under `public/` — SPEC §5.6 / §2.4. */
export const SITE_OG_IMAGE_PATH = '/og-image.png' as const;

export const SITE_OG_IMAGE_WIDTH = 1200;
export const SITE_OG_IMAGE_HEIGHT = 630;
export const SITE_OG_IMAGE_TYPE = 'image/png' as const;

/** Shared by `og:image:alt` and `twitter:image:alt` (SPEC §5.6). */
export const SITE_OG_IMAGE_ALT =
  'Iconify — high-performance icon set generator preview' as const;

export interface SiteOpenGraph {
  type: 'website';
  locale: 'en_US';
  siteName: string;
  title: string;
  description: string;
  url: string;
  image: string;
  imageWidth: typeof SITE_OG_IMAGE_WIDTH;
  imageHeight: typeof SITE_OG_IMAGE_HEIGHT;
  imageType: typeof SITE_OG_IMAGE_TYPE;
  imageAlt: typeof SITE_OG_IMAGE_ALT;
}

/** Full Open Graph property set — SPEC §5.6 table order. */
export function siteOpenGraph(site: string | URL): SiteOpenGraph {
  return {
    type: 'website',
    locale: 'en_US',
    siteName: name,
    title: name,
    description,
    url: siteCanonicalUrl(site),
    image: absoluteSiteUrl(SITE_OG_IMAGE_PATH, site),
    imageWidth: SITE_OG_IMAGE_WIDTH,
    imageHeight: SITE_OG_IMAGE_HEIGHT,
    imageType: SITE_OG_IMAGE_TYPE,
    imageAlt: SITE_OG_IMAGE_ALT,
  };
}
