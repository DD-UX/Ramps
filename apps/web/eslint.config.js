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
    // Icons enter the app through the kit's one door — `@ramps/ui/icons` — and
    // never the raw provider. This is the repo-level lever that makes the
    // convention self-enforcing: the editor (ESLint inline) and CI both reject
    // a stray `lucide-react` import and name the right source in the message,
    // so the provider stays swappable from a single file in the kit.
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message: "Import icons from '@ramps/ui/icons', not 'lucide-react' — the kit owns the icon provider.",
            },
          ],
          patterns: [
            {
              group: ['lucide-react/*'],
              message: "Import icons from '@ramps/ui/icons', not 'lucide-react' — the kit owns the icon provider.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
