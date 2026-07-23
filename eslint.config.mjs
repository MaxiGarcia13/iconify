import { eslintConfig } from '@maxigarcia/eslint-config';

export default eslintConfig(
  {
    typescript: true,
    tailwindcss: true,
    react: true,
    astro: true,
  },
  {
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
);
