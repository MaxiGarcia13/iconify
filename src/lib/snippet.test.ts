import { describe, expect, it } from 'vitest';

import { buildHeadHtml } from './snippet';

const SVG_LINK = '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />';

describe('buildHeadHtml', () => {
  it('matches SPEC §5.3 markup when source is SVG', () => {
    const html = buildHeadHtml({ themeColor: '#ffffff' }, true);

    expect(html).toBe(
      [
        '<link rel="icon" href="/favicon.ico" sizes="any" />',
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
        '<link rel="manifest" href="/site.webmanifest" />',
        '<meta name="theme-color" content="#ffffff" />',
        '<meta property="og:image" content="/og-image.png" />',
        '',
      ].join('\n'),
    );
  });

  it('omits the SVG favicon link when source is not SVG', () => {
    const html = buildHeadHtml({ themeColor: '#0a0a0a' }, false);

    expect(html).not.toContain(SVG_LINK);
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="any" />');
    expect(html).toContain('<meta name="theme-color" content="#0a0a0a" />');
    expect(html).toContain('<meta property="og:image" content="/og-image.png" />');
  });
});
