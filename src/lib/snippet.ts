/**
 * Build the copy-paste `<head>` fragment for the UI snippet panel.
 * Omits the SVG favicon link when the source was not SVG.
 * Not written into the ZIP — SPEC §5.3.
 */
export function buildHeadHtml(sourceIsSvg: boolean): string {
  const lines = [
    '<link rel="icon" href="/favicon.ico" sizes="any" />',
    ...(sourceIsSvg
      ? ['<link rel="icon" href="/favicon.svg" type="image/svg+xml" />']
      : []),
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
    '<meta property="og:image" content="/og-image.png" />',
  ];

  return `${lines.join('\n')}\n`;
}
