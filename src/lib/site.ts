/**
 * Site origin helpers for document-head absolute URLs (SPEC §5.6).
 */

/**
 * Resolve a site-relative path to an absolute URL from Astro `site`.
 * Used for `link[rel=canonical]`, `og:url`, and social image URLs.
 */
export function absoluteSiteUrl(pathname: string, site: string | URL): string {
  return new URL(pathname, site).href;
}

/** Absolute URL of `/` — SPEC §5.6 Core SEO canonical. */
export function siteCanonicalUrl(site: string | URL): string {
  return absoluteSiteUrl('/', site);
}
