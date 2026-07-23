import path from 'node:path';
import { eslintConfig } from '@maxigarcia/eslint-config';

export default eslintConfig(
  {
    typescript: true,
    tailwindcss: true,
    react: true,
    astro: true,
  },
  {
    settings: {
      tailwindcss: {
        // Tailwind v4 uses CSS-first config; point the plugin at the entry stylesheet.
        config: path.join(import.meta.dirname, 'src/index.css'),
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
);
