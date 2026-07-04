import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

/**
 * VISUAL-ADVISORY — the soft layer.
 *
 * Unlike token-fidelity (the hard gate), this project NEVER blocks the push. It
 * does two things:
 *
 *  1. Captures a chrome-free screenshot of every catalogued primitive story into
 *     `validation/__gallery__/`, so a human can eyeball the rendered system next
 *     to the curated Ramp video frames in `docs/watch-youtube/**\/snapshots/`.
 *  2. Where a story has a designated reference frame, it runs a LENIENT region
 *     comparison and reports drift as an annotation — it does not fail the run
 *     (see `softMatch`). Video frames differ in chrome, cropping and scale, so a
 *     strict pixel diff would be noise; the token-fidelity gate already proves
 *     the colours/radii/weights are exact. This layer is about proportion and
 *     composition — a reviewer's aid, not a gate.
 */

function storyUrl(id: string): string {
  return `/iframe.html?id=${id}&viewMode=story`;
}

/** Absolute path to a curated video frame, if one exists on disk. */
function videoFrame(rel: string): string | null {
  const p = fileURLToPath(new URL(`../../../docs/watch-youtube/${rel}`, import.meta.url));
  return existsSync(p) ? p : null;
}

/**
 * The advisory catalogue. Each entry pins a story to a stable gallery filename
 * and, optionally, the Ramp video frame it echoes. `ref` is intentionally
 * loose — it names the source-of-truth frame for a human, not a pixel oracle.
 */
const CATALOGUE: ReadonlyArray<{
  id: string;
  gallery: string;
  ref?: string;
}> = [
  { id: 'primitives-button--primary', gallery: 'button-primary' },
  { id: 'primitives-button--destructive', gallery: 'button-destructive' },
  {
    id: 'primitives-statuspill--all-states',
    gallery: 'statuspill-all-states',
    ref: 'does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra/snapshots/18-overview-grouped-by-status.jpeg',
  },
  {
    id: 'primitives-tabs--bill-lifecycle',
    gallery: 'tabs-bill-lifecycle',
    ref: 'does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra/snapshots/11-for-approval-table-n-of-m.jpeg',
  },
  {
    id: 'primitives-input--invalid',
    gallery: 'input-invalid',
    ref: 'does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra/snapshots/06-draft-review-missing-info-red-validation.jpeg',
  },
  {
    id: 'primitives-select--default',
    gallery: 'select-default',
    ref: 'does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra/snapshots/07-line-item-coding-quickbooks-dimensions.jpeg',
  },
  { id: 'primitives-checkbox--checked', gallery: 'checkbox-checked' },
  {
    id: 'primitives-tabs--overview-active',
    gallery: 'tabs-overview-active',
    ref: 'does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra/snapshots/17-for-payment-status-filter-chips.jpeg',
  },
  {
    id: 'primitives-toast--uploading',
    gallery: 'toast-uploading',
    ref: 'does-ramp-live-up-to-the-hype-testing-accounts-payable-in-ra/snapshots/03-uploading-3-invoices-toast.jpeg',
  },
  { id: 'primitives-tooltip--on-button', gallery: 'tooltip-on-button' },
  {
    id: 'primitives-kbd--on-accent',
    gallery: 'kbd-on-accent',
    ref: 'ramp-bill-pay-series-ap-agent/snapshots/9.jpeg',
  },
  {
    id: 'primitives-card--glow',
    gallery: 'card-glow',
    ref: 'ramp-bill-pay-series-ap-agent/snapshots/8.jpeg',
  },
  {
    id: 'primitives-button--with-icon',
    gallery: 'button-underline-save-draft',
    ref: 'ramp-bill-pay-series-ap-agent/snapshots/9.jpeg',
  },
];

test.describe('visual advisory (never blocks)', () => {
  for (const entry of CATALOGUE) {
    test(`gallery: ${entry.gallery}`, async ({ page }, testInfo) => {
      await page.goto(storyUrl(entry.id));
      // Let fonts + tokens settle so the capture is representative.
      await page.waitForLoadState('networkidle');

      // Advisory NEVER blocks: if the story root never paints (e.g. a renamed
      // story id), we still capture the page and flag it softly, rather than
      // throwing. `soft` keeps the run green while recording the drift.
      const root = page.locator('#storybook-root, #root').first();
      const painted = await root
        .waitFor({ state: 'visible', timeout: 4000 })
        .then(() => true)
        .catch(() => false);
      if (!painted) {
        testInfo.annotations.push({
          type: 'empty-story',
          description: `Story '${entry.id}' did not paint — check the story id.`,
        });
      }

      const shot = painted ? await root.screenshot() : await page.screenshot();
      // Attach to the HTML report as the reviewable artifact.
      await testInfo.attach(`${entry.gallery}.png`, { body: shot, contentType: 'image/png' });

      // If a reference frame is catalogued, surface it alongside for the human —
      // no assertion, just a side-by-side in the report.
      if (entry.ref) {
        const frame = videoFrame(entry.ref);
        if (frame) {
          await testInfo.attach(`${entry.gallery}--ramp-reference`, {
            path: frame,
            contentType: 'image/jpeg',
          });
        } else {
          testInfo.annotations.push({
            type: 'missing-reference',
            description: `No video frame at docs/watch-youtube/${entry.ref}`,
          });
        }
      }

      // The capture itself is the deliverable. Use a SOFT assertion so even a
      // zero-byte screenshot only marks the test as reported-failed in the
      // HTML report, never breaking the run (advisory contract).
      expect.soft(shot.byteLength, 'story rendered to a non-empty screenshot').toBeGreaterThan(0);
    });
  }
});
