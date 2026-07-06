import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * @ramps/web unit tests. Colocated with the code they cover
 * (`format-date.helpers.ts` → `format-date.helpers.test.ts`). The `@/` alias
 * mirrors the tsconfig path so tests import the same way app code does.
 *
 * Two projects, split by file extension so each pays only for what it needs:
 *  - `helpers` (node): the pure helpers/constants/data — no DOM, so the fast
 *    node environment. `*.test.ts`.
 *  - `components` (jsdom): the React render tests — jsdom + Testing Library,
 *    with a setup file that loads jest-dom matchers and auto-cleans between
 *    tests. `*.test.tsx`. `next/navigation` is mocked per-file (the App Router
 *    hooks have no provider under vitest).
 */
const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'helpers',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // The React plugin gives the jsdom project the JSX/tsx transform and
        // Fast Refresh runtime the render tests need.
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
