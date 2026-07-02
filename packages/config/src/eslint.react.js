import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

import base from './eslint.config.js';

/**
 * React preset: base rules + hooks correctness + a11y + Storybook.
 * Used by packages/ui and apps/web:
 *
 *   export { default } from '@ramps/config/eslint-react';
 */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  ...storybook.configs['flat/recommended'],
];
