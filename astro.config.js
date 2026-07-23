import process from 'node:process';

import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // SPEC §5.6 — canonical origin for absolute OG/Twitter/canonical URLs
  site: process.env.SITE || 'http://localhost:4321',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
