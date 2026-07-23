import { describe, expect, it } from 'vitest';

import { buildHeadHtml } from './snippet';

describe('buildHeadHtml', () => {
  it('includes SVG favicon link when source is SVG (SPEC §5.3)', () => {
    const html = buildHeadHtml(true);

    expect(html).toBe(
      [
        '<link rel="icon" href="/favicon.ico" sizes="any" />',
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
        '<meta property="og:image" content="/og-image.png" />',
        '',
      ].join('\n'),
    );
  });

  it('omits SVG favicon link when source is raster (SPEC §5.3)', () => {
    const html = buildHeadHtml(false);

    expect(html).not.toContain('favicon.svg');
    expect(html).toContain('favicon.ico');
    expect(html).toContain('og-image.png');
    expect(html).not.toContain('site.webmanifest');
    expect(html).not.toContain('theme-color');
  });
});
