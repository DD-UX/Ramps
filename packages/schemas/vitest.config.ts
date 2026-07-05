import { defineConfig } from 'vitest/config';

/**
 * @ramps/schemas unit tests run in Node — the package is pure zod, no DOM.
 * Tests are colocated next to the schema they cover (`primitives.ts` →
 * `primitives.test.ts`).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
