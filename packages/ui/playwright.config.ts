import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the design-system validation suite.
 *
 * Two layered projects (see the design-system-validate skill):
 *  - `token-fidelity` — the HARD gate. Asserts each primitive's computed styles
 *    resolve to the verified Ramp `--rui-*` token values. Fast, deterministic,
 *    blocks the push on failure.
 *  - `visual-advisory` — screenshot capture + optional region diff against the
 *    curated video frames. Reported, never blocks (see the test's soft-assert).
 *
 * The suite runs against the STATIC Storybook build (storybook-static/), served
 * locally, so it validates exactly what ships to /storybook — no dev-server
 * drift. Build it first: `pnpm build-storybook`.
 */
const PORT = 6099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './validation',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'validation/report' }]],
  use: {
    baseURL: BASE_URL,
    // Deterministic rendering for stable computed-style + pixel comparisons.
    deviceScaleFactor: 1,
    viewport: { width: 1280, height: 720 },
    // Drive the full Chromium binary (new headless mode) rather than the
    // separate chrome-headless-shell download — one browser to provision, and
    // it renders exactly like the headed browser a reviewer would open.
    channel: 'chromium',
  },
  projects: [
    {
      // The HARD gate. Two spec families, both blocking:
      //  - token-fidelity     — computed styles resolve to the --rui-* tokens.
      //  - structure-fidelity — the measured *look & feel* from the Ramp frames
      //    (near-square radii, disabled affordance, soft-glow elevation, floating
      //    label, animated underline anchor). Tokens AND mocks, per the brief.
      name: 'token-fidelity',
      testMatch: /(token-fidelity|structure-fidelity)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
    {
      name: 'visual-advisory',
      testMatch: /visual-advisory\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  // Serve the static Storybook build for the suite.
  webServer: {
    command: `pnpm exec http-server storybook-static -p ${PORT} -s`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
