import next from '@next/eslint-plugin-next';

import react from '@ramps/config/eslint-react';

export default [
  ...react,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@next/next': next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
