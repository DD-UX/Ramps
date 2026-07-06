import { defineConfig } from 'vitest/config';

/**
 * @ramps/ui unit tests cover the package's pure logic — chiefly `cn`, the
 * className resolver (`tailwind-merge` + `clsx`) that every primitive now routes
 * through. It's plain string-in/string-out with no DOM, so we run in Node.
 *
 * `include` is scoped to `src/**` on purpose: the design system's *rendered*
 * behaviour is covered by the Playwright suite under `validation/` (a separate
 * `@playwright/test` runner). Restricting the glob keeps Vitest from trying to
 * collect those specs.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
