import { expect, test } from '@playwright/test';

import { RUI } from './tokens.fixture';

/**
 * STRUCTURE-FIDELITY — the second half of the hard gate ("mocks", not just
 * tokens).
 *
 * token-fidelity proves the *values* are right (this color is the accent, that
 * radius is the control token). It does NOT prove a component *looks* like the
 * Ramp product — a button can use every correct token and still be visibly
 * wrong (no disabled affordance, corners too round, no icon slot).
 *
 * This spec encodes the measured design facts from the AP-agent frames
 * (docs/watch-youtube/ramp-bill-pay-series-ap-agent/snapshots) as deterministic,
 * chrome-free assertions:
 *   - near-square corners on controls/cards (radius-square, not surface),
 *   - a real disabled affordance (dimmed + not-allowed, not identical to base),
 *   - the soft-glow elevation on the approval card,
 *   - the floating label that rises when a Select has a value,
 *   - the animated tab underline's single shared indicator.
 *
 * These are the "look & feel" contract the redone components (B11–B19) must
 * satisfy. Blocks the push, exactly like token-fidelity.
 *
 * Frame references (for the human, cited in each block):
 *   snapshot 6 — For-approval table: icon button, chevron button, tab underline
 *   snapshot 7 — vendor Popover hovercard, stacked approver avatars
 *   snapshot 8 — bill detail: soft-glow approval Card, drag handle, tab underline
 *   snapshot 9 — line-item editor: floating-label Selects, plain Inputs, ⌘↵ chip
 */

/** Storybook static: render a single story chrome-free. */
function storyUrl(id: string): string {
  return `/iframe.html?id=${id}&viewMode=story`;
}

/** px string → number (e.g. "6px" → 6). NaN-safe for empty/auto. */
function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

test.describe('structure fidelity (look & feel vs the Ramp frames)', () => {
  /**
   * Measured from the frames at 5-7x zoom (does-ramp-live-up §06/07: "Create
   * bill" button, Invoice # input, line-item selects, Incomplete badge, toast
   * edge): the design has NO round corners. `square` is exactly 0px and it is
   * the only rectangle radius — the old control/surface tokens are gone so a
   * soft radius can never sneak back in.
   */
  test('radius-square token is the sharp 0px corner the frames show', () => {
    expect(RUI['--rui-radius-square'], 'radius-square token exists').toBeDefined();
    expect(px(RUI['--rui-radius-square']), 'radius-square is exactly 0 (no rounding)').toBe(0);
    expect(RUI['--rui-radius-control'], 'legacy control radius removed').toBeUndefined();
    expect(RUI['--rui-radius-surface'], 'legacy surface radius removed').toBeUndefined();
  });

  /**
   * Snapshot 6/9 — the disabled "Create bill"/action buttons read clearly
   * inert: dimmed and not-allowed, NOT pixel-identical to the enabled base.
   * (This was the concrete defect the reviewer flagged.)
   */
  test('Button/disabled has a real disabled affordance (dimmed + not-allowed)', async ({ page }) => {
    await page.goto(storyUrl('primitives-button--disabled'));
    const btn = page.getByRole('button').first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveCSS('cursor', 'not-allowed');
    // Dimmed: opacity strictly below full, so it is visibly distinct from base.
    const opacity = await btn.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity, 'disabled button is dimmed').toBeLessThan(1);
  });

  /**
   * Snapshot 6/9 — buttons carry leading icons (Lucide) and, for the primary
   * submit, a trailing ⌘↵ keyboard chip. Assert the icon renders as an inline
   * SVG inside the button, so the icon slot is real, not decorative text.
   */
  test('Button/with-icon renders a leading Lucide SVG in the label', async ({ page }) => {
    await page.goto(storyUrl('primitives-button--with-icon'));
    const btn = page.getByRole('button').first();
    await expect(btn.locator('svg').first()).toBeVisible();
  });

  /**
   * Snapshot 9 — the line-item Input is near-square, thin bone border, white
   * fill. Assert the corner is the square token, not the soft surface radius.
   */
  test('Input uses the near-square corner, never the soft surface radius', async ({ page }) => {
    await page.goto(storyUrl('primitives-input--default'));
    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible();
    const r = await input.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(r, 'input corner is near-square').toBeLessThanOrEqual(px(RUI['--rui-radius-square']) + 1);
  });

  /**
   * Snapshot 9 — the Select shows its label floating ABOVE the value once a
   * value is chosen (MUI-style). In the "filled" story the label sits at the
   * top edge of the control, not centred as a placeholder.
   */
  test('Select/filled floats its label above the chosen value', async ({ page }) => {
    await page.goto(storyUrl('primitives-select--filled'));
    const control = page.getByRole('combobox').first();
    await expect(control).toBeVisible();
    const label = page.getByTestId('select-label').first();
    await expect(label).toBeVisible();
    // The floated label's vertical centre sits in the top third of the control.
    const box = await control.boundingBox();
    const lbox = await label.boundingBox();
    expect(box).not.toBeNull();
    expect(lbox).not.toBeNull();
    if (box && lbox) {
      const labelCentre = lbox.y + lbox.height / 2;
      expect(labelCentre, 'label floats into the top third').toBeLessThan(box.y + box.height / 3);
    }
  });

  /**
   * The Select is a STANDARD control — a real native `<select>` element, not
   * a custom listbox. The rich, searchable option rows belong to Dropdown.
   */
  test('Select renders a real native <select> element', async ({ page }) => {
    await page.goto(storyUrl('primitives-select--filled'));
    const control = page.getByRole('combobox').first();
    await expect(control).toBeVisible();
    const tag = await control.evaluate((el) => el.tagName);
    expect(tag, 'the standard Select is a native <select>').toBe('SELECT');
  });

  /**
   * 1099-s frames 07/08 — the tailored line-item Dropdown opens a square
   * popup with a search input on top and rich option rows (title + hushed
   * secondary line like "Box 1").
   */
  test('Dropdown opens a searchable popup with rich option rows', async ({ page }) => {
    await page.goto(storyUrl('primitives-dropdown--box-mapping'));
    await page.getByRole('combobox').click();
    const popup = page.getByTestId('dropdown');
    await expect(popup).toBeVisible();
    await expect(popup.getByPlaceholder('Search…')).toBeVisible();
    const rows = page.getByTestId('dropdown-option');
    expect(await rows.count(), 'multiple rich rows render').toBeGreaterThan(3);
    await expect(popup.getByText('Box 2', { exact: true })).toBeVisible();
    // The pinned footer row is separated below the list (frame 07).
    await expect(popup.getByText('Not reportable', { exact: true })).toBeVisible();
  });

  /**
   * Snapshot 8 — the "Ready to approve" Card is a soft-glow tinted panel:
   * near-square corner + a real box-shadow (the green halo), not a hard border.
   */
  test('Card/glow is a soft-glow panel (shadow present, near-square corner)', async ({ page }) => {
    await page.goto(storyUrl('primitives-card--glow'));
    const card = page.getByTestId('card').first();
    await expect(card).toBeVisible();
    const shadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow, 'card carries a soft-glow shadow').not.toBe('none');
    const r = await card.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(r, 'card corner is near-square').toBeLessThanOrEqual(px(RUI['--rui-radius-square']) + 1);
  });

  /**
   * Snapshot 6/8 — the Tabs underline is a SINGLE shared indicator that slides
   * between tabs (Motion shared layout), not one static border per tab. Assert
   * exactly one indicator element exists across the tablist.
   */
  test('Tabs render a single shared underline indicator', async ({ page }) => {
    await page.goto(storyUrl('primitives-tabs--bill-lifecycle'));
    await expect(page.getByRole('tablist').first()).toBeVisible();
    const indicators = page.getByTestId('tab-underline');
    await expect(indicators).toHaveCount(1);
  });

  /**
   * Snapshot 7 — the approver stack (UserAvatars) overlaps avatars. Assert the
   * second avatar starts before the first one ends (negative overlap), proving
   * the stack, not a plain row.
   */
  test('UserAvatars overlaps stacked avatars', async ({ page }) => {
    await page.goto(storyUrl('primitives-useravatars--approval-chain'));
    const avatars = page.getByTestId('stacked-avatar');
    await expect(avatars.first()).toBeVisible();
    const count = await avatars.count();
    expect(count, 'stack has multiple avatars').toBeGreaterThan(1);
    const first = await avatars.nth(0).boundingBox();
    const second = await avatars.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (first && second) {
      expect(second.x, 'avatars overlap').toBeLessThan(first.x + first.width);
    }
  });
});
