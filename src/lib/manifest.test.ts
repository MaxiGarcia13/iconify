import { describe, expect, it } from 'vitest';

import { buildSiteWebmanifest } from './manifest';

describe('buildSiteWebmanifest', () => {
  it('matches SPEC §2.3 shape with default-like options', () => {
    const json = buildSiteWebmanifest({
      appName: 'App',
      themeColor: '#ffffff',
      backgroundColor: '#ffffff',
    });

    expect(JSON.parse(json)).toEqual({
      name: 'App',
      short_name: 'App',
      icons: [
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
      ],
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
    });
  });

  it('applies appName, themeColor, and backgroundColor overrides', () => {
    const json = buildSiteWebmanifest({
      appName: 'Iconify',
      themeColor: '#0a0a0a',
      backgroundColor: '#f5f5f5',
    });

    const manifest = JSON.parse(json) as {
      name: string;
      short_name: string;
      theme_color: string;
      background_color: string;
    };

    expect(manifest.name).toBe('Iconify');
    expect(manifest.short_name).toBe('Iconify');
    expect(manifest.theme_color).toBe('#0a0a0a');
    expect(manifest.background_color).toBe('#f5f5f5');
  });
});
