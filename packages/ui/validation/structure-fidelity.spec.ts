import { expect, test } from '@playwright/test';

import { hexToRgb, RUI } from './tokens.fixture';

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
   * Snapshot 9 — "Save draft" is an UNDERLINED ink text link (floppy icon +
   * underline), not a filled or bordered button. And like every enabled
   * control, it reads clickable: cursor pointer (Tailwind v4's preflight
   * defaults buttons to `cursor: default`, so this is an explicit contract).
   */
  test('Button/underline is the "Save draft" text link (frame 9)', async ({ page }) => {
    await page.goto(storyUrl('primitives-button--underline'));
    const btn = page.getByRole('button', { name: /Save draft/ });
    await expect(btn).toBeVisible();
    const styles = await btn.evaluate((el) => {
      const s = getComputedStyle(el);
      return { deco: s.textDecorationLine, bg: s.backgroundColor, cursor: s.cursor };
    });
    expect(styles.deco, 'label is underlined').toContain('underline');
    expect(styles.bg, 'no fill — a bare text link').toBe('rgba(0, 0, 0, 0)');
    expect(styles.cursor, 'enabled buttons read clickable').toBe('pointer');
  });

  /**
   * Snapshot 9 — the lime "Create bill" primary carries its shortcut as TWO
   * separate raised chips (⌘ then ↵), rendered as real <kbd> elements.
   */
  test('Button/with-keys renders two separate <kbd> chips and a pointer cursor', async ({ page }) => {
    await page.goto(storyUrl('primitives-button--with-keys'));
    const btn = page.getByRole('button', { name: /Create bill/ });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveCSS('cursor', 'pointer');
    await expect(btn.locator('kbd')).toHaveCount(2);
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
   * does-ramp-live-up §15 at 8x zoom — the checked checkbox is a SOLID
   * success-green square (sharp corner, no rounding) with a white tick,
   * not the accent lime and not a rounded chip.
   */
  test('Checkbox/checked is a sharp positive-green square', async ({ page }) => {
    await page.goto(storyUrl('primitives-checkbox--checked'));
    const box = page.getByRole('checkbox').first();
    await expect(box).toBeVisible();
    await expect(box).toBeChecked();
    const styles = await box.evaluate((el) => {
      const s = getComputedStyle(el);
      return { radius: Number.parseFloat(s.borderTopLeftRadius), bg: s.backgroundColor };
    });
    expect(styles.radius, 'checkbox corner is sharp').toBeLessThanOrEqual(
      px(RUI['--rui-radius-square']) + 1,
    );
    expect(styles.bg, 'checked fill is the solid positive green').toBe(
      hexToRgb(RUI['--rui-positive']),
    );
  });

  /**
   * The disabled affordance covers the whole hit area: clicking the LABEL of a
   * disabled checkbox must read not-allowed too, not just the box itself
   * (`has-[input:disabled]` on the label).
   */
  test('Checkbox/disabled label reads not-allowed across the whole hit area', async ({ page }) => {
    await page.goto(storyUrl('primitives-checkbox--disabled'));
    const label = page.locator('label', { hasText: 'Tax details' }).first();
    await expect(label).toBeVisible();
    await expect(label).toHaveCSS('cursor', 'not-allowed');
  });

  /**
   * Snapshot 3 — a single-line toast (title only, no description) centres its
   * spinner, title and dismiss on ONE axis. The fix is gap-driven: the icon box
   * matches the 20px title line and the dismiss button recentres with -my-1,
   * so the three vertical centres coincide.
   */
  test('Toast/single-line centres icon, title and dismiss on one axis', async ({ page }) => {
    await page.goto(storyUrl('primitives-toast--uploading'));
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    const rows = [
      toast.locator('span[aria-hidden]').first(),
      toast.getByText('Uploading 3 invoices'),
      toast.getByRole('button', { name: 'Dismiss' }),
    ];
    const centres: number[] = [];
    for (const loc of rows) {
      const box = await loc.boundingBox();
      expect(box).not.toBeNull();
      if (box) centres.push(box.y + box.height / 2);
    }
    const spread = Math.max(...centres) - Math.min(...centres);
    expect(spread, 'icon/title/dismiss centres align').toBeLessThanOrEqual(1.5);
  });

  /**
   * Snapshot 7 at 10x — the split-view grip is a CIRCULAR **limestone** chip
   * (soft shadow, ink dots) riding the hairline rail: one of the kit's few
   * vetted-round elements, and it reads a step darker than the white panes it
   * separates. Assert a true circle (square box + >= half-width radius),
   * limestone fill, and borderless.
   */
  test('DraggablePanel grip is the circular limestone chip from frame 7', async ({ page }) => {
    await page.goto(storyUrl('primitives-draggablepanel--bill-detail'));
    const grip = page.getByTestId('drag-grip');
    await expect(grip).toBeVisible();
    const m = await grip.evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        w: r.width,
        h: r.height,
        radius: Number.parseFloat(s.borderTopLeftRadius),
        bg: s.backgroundColor,
        borderW: Number.parseFloat(s.borderTopWidth),
      };
    });
    expect(Math.abs(m.w - m.h), 'grip box is square').toBeLessThanOrEqual(1);
    expect(m.radius, 'radius >= half width — a circle').toBeGreaterThanOrEqual(m.w / 2 - 1);
    expect(m.bg, 'limestone chip — a step darker than the panes').toBe(
      hexToRgb(RUI['--rui-limestone']),
    );
    expect(m.borderW, 'no border — the shadow does the lifting').toBe(0);
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
   * Snapshot 1 — the toolbar pair: "Search or filter…" and "Options ▾" are the
   * two fully ROUNDED (pill) controls in the frames, opted in via the boolean
   * `rounded` prop. Assert the pill: radius >= half the rendered height.
   */
  test('Button/rounded and Input/rounded are the frame-1 toolbar pills', async ({ page }) => {
    await page.goto(storyUrl('primitives-button--rounded'));
    const btn = page.getByRole('button', { name: /Options/ });
    await expect(btn).toBeVisible();
    const b = await btn.evaluate((el) => ({
      h: el.getBoundingClientRect().height,
      r: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
    }));
    expect(b.r, 'rounded button is a pill').toBeGreaterThanOrEqual(b.h / 2 - 1);

    await page.goto(storyUrl('primitives-input--rounded'));
    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible();
    const i = await input.evaluate((el) => ({
      // The pill skin lives on the <input> itself; the wrapper only positions
      // the adornment.
      h: el.getBoundingClientRect().height,
      r: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
    }));
    expect(i.r, 'rounded input is a pill').toBeGreaterThanOrEqual(i.h / 2 - 1);
  });

  /**
   * The click-mode Popover contract (default trigger): clicking the trigger
   * pins the card open; it STAYS open until a click lands outside or Esc is
   * pressed (`useClickAway`). Hover mode remains the frame-7 hovercard.
   */
  test('Popover/click opens on click and dismisses on click-away and Esc', async ({ page }) => {
    await page.goto(storyUrl('primitives-popover--on-click'));
    const trigger = page.getByRole('button', { name: 'Staples' });
    const popover = page.getByTestId('popover');

    await trigger.click();
    await expect(popover).toBeVisible();

    // Click-away dismisses.
    await page.mouse.click(600, 400);
    await expect(popover).toBeHidden();

    // Esc dismisses too.
    await trigger.click();
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
  });

  /**
   * Frame 13 ("When do you want to pay this bill?") — the Modal is ONE white
   * padded panel over a LIGHT scrim (sampled ~#f8f4f5 — a whitish wash, never
   * a dark dim): near-square corner, real dialog semantics, ✕ in the header.
   */
  test('Modal is the frame-13 dialog: light scrim, square white panel', async ({ page }) => {
    await page.goto(storyUrl('primitives-modal--when-to-pay'));
    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveRole('dialog');
    await expect(modal.getByRole('button', { name: 'Close' })).toBeVisible();

    const r = await modal.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(r, 'panel corner is near-square').toBeLessThanOrEqual(px(RUI['--rui-radius-square']) + 1);

    // Tailwind v4 emits `bg-white/75` via color-mix, so the computed value is
    // an oklab() white in Chromium. Assert the two facts that matter: the veil
    // is (near-)white and 75% opaque — never a dark dim.
    const overlayBg = await page
      .getByTestId('modal-overlay')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const isWhiteVeil =
      /^rgba\(255, 255, 255, 0\.75\)$/.test(overlayBg) ||
      /^oklab\(0\.99\d*\b[^)]*\/ 0\.75\)$/.test(overlayBg);
    expect(isWhiteVeil, `scrim is a light whitish veil at 75% (got: ${overlayBg})`).toBe(true);
  });

  /**
   * Modal dismissal inherits the same `useClickAway` contract: Esc and a
   * click on the scrim both close it (Interactive story owns real state).
   */
  test('Modal dismisses on Esc and on scrim click', async ({ page }) => {
    await page.goto(storyUrl('primitives-modal--interactive'));
    const openBtn = page.getByRole('button', { name: 'Pay bill' });
    const modal = page.getByTestId('modal');

    await openBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    await openBtn.click();
    await expect(modal).toBeVisible();
    // Click the scrim near the viewport corner — well outside the panel.
    await page.mouse.click(8, 8);
    await expect(modal).toBeHidden();
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
