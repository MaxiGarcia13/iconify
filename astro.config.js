import process from 'node:process';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const SITE_URL = process.env.NODE_ENV === 'production'
  ? `https://icon-sets-generator.vercel.app`
  : 'http://localhost:4321';

export default defineConfig({
  // SPEC §5.6 — canonical origin for absolute OG/Twitter/canonical URLs
  site: SITE_URL,
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
