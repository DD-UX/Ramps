import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * @ramps/web unit tests. Colocated with the code they cover
 * (`statusTabs.ts` → `statusTabs.test.ts`). The `@/` alias mirrors the
 * tsconfig path so tests import the same way app code does. Node environment
 * for now — the current suites cover pure helpers/constants; a jsdom project
 * can be added when component tests land.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
