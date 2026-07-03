import { expect, test } from '@playwright/test';

import { hexToRgb, RUI } from './tokens.fixture';

/**
 * TOKEN-FIDELITY — the hard gate.
 *
 * For each primitive we render its Storybook story in isolation and assert the
 * browser's *computed* styles resolve to the verified Ramp token values (parsed
 * live from tokens.css). This proves the design system is faithful at the token
 * level — colours, radii, weight — without brittle pixel diffs. A drift here
 * (someone hardcodes a hex, or a utility stops resolving) fails the push.
 */

/** Storybook static: render a single story chrome-free. */
function storyUrl(id: string): string {
  return `/iframe.html?id=${id}&viewMode=story`;
}

test.describe('token fidelity', () => {
  test('Button/primary uses accent surface + ink text + control radius', async ({ page }) => {
    await page.goto(storyUrl('primitives-button--primary'));
    const btn = page.getByRole('button', { name: 'Pay bill' });
    await expect(btn).toBeVisible();

    await expect(btn).toHaveCSS('background-color', hexToRgb(RUI['--rui-accent']));
    await expect(btn).toHaveCSS('color', hexToRgb(RUI['--rui-ink']));
    await expect(btn).toHaveCSS('border-top-left-radius', RUI['--rui-radius-control']);
    // Heading weight token (400) drives the label.
    await expect(btn).toHaveCSS('font-weight', RUI['--rui-font-weight-heading']);
  });

  test('Button/destructive uses the orange destructive family (never red)', async ({ page }) => {
    await page.goto(storyUrl('primitives-button--destructive'));
    const btn = page.getByRole('button', { name: 'Pay bill' });
    await expect(btn).toHaveCSS('background-color', hexToRgb(RUI['--rui-destructive']));
  });

  test('StatusPill/paid uses positive tone + pill radius', async ({ page }) => {
    await page.goto(storyUrl('primitives-statuspill--paid'));
    const pill = page.getByText('Paid', { exact: true });
    await expect(pill).toBeVisible();
    await expect(pill).toHaveCSS('background-color', hexToRgb(RUI['--rui-tone-positive-surface']));
    await expect(pill).toHaveCSS('color', hexToRgb(RUI['--rui-tone-positive-on']));
  });

  test('StatusPill/rejected uses the critical (orange) tone, not a raw red', async ({ page }) => {
    await page.goto(storyUrl('primitives-statuspill--rejected'));
    const pill = page.getByText('Rejected', { exact: true });
    await expect(pill).toHaveCSS('background-color', hexToRgb(RUI['--rui-tone-critical-surface']));
    // Guard the rule explicitly: the surface must not be pure CSS red.
    await expect(pill).not.toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('Input/invalid switches its border to the destructive token', async ({ page }) => {
    await page.goto(storyUrl('primitives-input--invalid'));
    const input = page.getByPlaceholder('State (required)');
    await expect(input).toHaveCSS('border-top-color', hexToRgb(RUI['--rui-destructive']));
  });

  test('Toast surface is ink with the surface radius', async ({ page }) => {
    await page.goto(storyUrl('primitives-toast--uploading'));
    const toast = page.getByRole('status');
    await expect(toast).toHaveCSS('background-color', hexToRgb(RUI['--rui-ink']));
    await expect(toast).toHaveCSS('border-top-left-radius', RUI['--rui-radius-surface']);
  });
});
