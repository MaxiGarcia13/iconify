import type { GenerateOptions } from './icons/types';

/** Fixed Android/PWA icon entries — SPEC §2.3. */
const MANIFEST_ICONS = [
  {
    src: '/android-chrome-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/android-chrome-512x512.png',
    sizes: '512x512',
    type: 'image/png',
  },
] as const;

/**
 * Build `site.webmanifest` JSON string.
 * Icon paths/sizes are fixed; name/colors come from generate options.
 * SPEC §2.3.
 */
export function buildSiteWebmanifest(
  options: Pick<GenerateOptions, 'appName' | 'themeColor' | 'backgroundColor'>,
): string {
  return JSON.stringify({
    name: options.appName,
    short_name: options.appName,
    icons: MANIFEST_ICONS,
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    display: 'standalone',
  });
}
