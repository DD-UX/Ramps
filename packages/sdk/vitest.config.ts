import { defineConfig } from 'vitest/config';

/**
 * @ramps/sdk unit tests run in Node — the SDK is server-side (the DB hop) and
 * its logic (facade mapping, error normalization) has no DOM. Tests are
 * colocated next to the code they cover (`bills.ts` → `bills.test.ts`).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
