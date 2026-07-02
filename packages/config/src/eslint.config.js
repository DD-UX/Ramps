// @ts-check
/**
 * Shared ESLint flat config for the monorepo.
 * Workspaces re-export this from their own `eslint.config.js`:
 *
 *   export { default } from '@ramps/config/eslint';
 *
 * Stub for now — rules land alongside the first real code so lint stays
 * meaningful rather than aspirational.
 *
 * @type {ReadonlyArray<{ ignores?: string[] }>}
 */
const config = [
  {
    ignores: ['dist/**', '.next/**', '.turbo/**', 'storybook-static/**', 'coverage/**'],
  },
];

export default config;
