import type { GenerateOptions } from './icons/types';

/**
 * Build the copy-paste `<head>` fragment written to `head.html`.
 * Omits the SVG favicon link when the source was not SVG.
 * SPEC §5.3.
 */
export function buildHeadHtml(
  options: Pick<GenerateOptions, 'themeColor'>,
  sourceIsSvg: boolean,
): string {
  const lines = [
    '<link rel="icon" href="/favicon.ico" sizes="any" />',
    ...(sourceIsSvg
      ? ['<link rel="icon" href="/favicon.svg" type="image/svg+xml" />']
      : []),
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
    '<link rel="manifest" href="/site.webmanifest" />',
    `<meta name="theme-color" content="${options.themeColor}" />`,
    '<meta property="og:image" content="/og-image.png" />',
  ];

  return `${lines.join('\n')}\n`;
}
