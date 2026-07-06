import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Shared setup for the jsdom `components` project. Pulls in jest-dom's custom
 * matchers (`toBeInTheDocument`, `toHaveAttribute`, …) and unmounts every
 * rendered tree after each test so React state / portals never leak across
 * cases. Router mocking is per-file (each component mocks only the
 * `next/navigation` hooks it uses), not global, so the mock stays honest to
 * what each component actually calls.
 */
afterEach(() => {
  cleanup();
});
