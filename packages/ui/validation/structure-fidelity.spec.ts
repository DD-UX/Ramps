import { expect, test } from '@playwright/test';

// Runtime-safe: toastVariants.ts only type-imports from motion/react.
import { TOAST_VARIANTS } from '../src/components/Toast/toastVariants';
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
   * Snapshot 7 at 10x + 1px sampling — the split-view grip is a CIRCULAR
   * **stone** chip (face samples #dcdbd6–#e6e2df: a full step darker than
   * limestone, which had no contrast against the panes), soft shadow, ink
   * dots, borderless. And the RIGHT pane is the preview CANVAS: the warm
   * limestone wash (#f6f5f1–#fbfaf6 in frames 7/8/10) the white invoice
   * sheet floats on — never the same white as the form pane.
   */
  test('DraggablePanel grip is the stone chip and the right pane is the limestone canvas', async ({
    page,
  }) => {
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
    expect(m.bg, 'stone chip — a full step darker than the panes').toBe(
      hexToRgb(RUI['--rui-stone']),
    );
    expect(m.borderW, 'no border — the shadow does the lifting').toBe(0);

    // Right pane canvas: the grip's parent rail's next sibling.
    const rightBg = await page
      .getByTestId('drag-handle')
      .evaluate((el) => getComputedStyle(el.nextElementSibling as Element).backgroundColor);
    expect(rightBg, 'right pane is the limestone preview canvas').toBe(
      hexToRgb(RUI['--rui-limestone']),
    );
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
   * pressed (`useClickAway`). Hover mode remains the frame-7 hovercard —
   * and the click card must land in the SAME spot hover's Positioner puts
   * it: centered under the trigger (it used to hang off the left edge).
   */
  test('Popover/click opens on click and dismisses on click-away and Esc', async ({ page }) => {
    await page.goto(storyUrl('primitives-popover--on-click'));
    const trigger = page.getByRole('button', { name: 'Staples' });
    const popover = page.getByTestId('popover');

    await trigger.click();
    await expect(popover).toBeVisible();

    // Centered under the trigger, matching hover mode's align="center".
    await expect
      .poll(async () => {
        const t = await trigger.boundingBox();
        const p = await popover.boundingBox();
        if (!t || !p) return Number.POSITIVE_INFINITY;
        return Math.abs(t.x + t.width / 2 - (p.x + p.width / 2));
      })
      .toBeLessThan(1.5);

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
  /**
   * The Toast motion contract: 9 spreadable presets — one per screen
   * position — each a classic three-phase variant object (initial/animate/
   * exit) plus a transition, so `<Toast transition={TOAST_VARIANTS.x}>` is
   * all a developer needs. Motion is SINGLE-AXIS by rule: left/right
   * presets (sides and corners) slide on X only, top/bottom-centre on Y
   * only — never diagonal — and popCenter grows in place (scale, no x/y).
   */
  test('TOAST_VARIANTS ships 9 positional presets with initial/animate/exit', () => {
    const names = Object.keys(TOAST_VARIANTS);
    expect(names, 'exactly 9 positions').toHaveLength(9);
    expect(names.sort()).toEqual(
      [
        'popCenter',
        'slideBottom',
        'slideBottomLeft',
        'slideBottomRight',
        'slideLeft',
        'slideRight',
        'slideTop',
        'slideTopLeft',
        'slideTopRight',
      ].sort(),
    );
    for (const [name, preset] of Object.entries(TOAST_VARIANTS)) {
      expect(preset.initial, `${name}.initial`).toBeDefined();
      expect(preset.animate, `${name}.animate`).toBeDefined();
      expect(preset.exit, `${name}.exit`).toBeDefined();
      expect(preset.transition, `${name}.transition`).toBeDefined();

      // Single-axis rule: never diagonal.
      const initial = preset.initial as Record<string, number>;
      if (name === 'popCenter') {
        expect(initial.x ?? 0, 'popCenter never translates').toBe(0);
        expect(initial.y ?? 0, 'popCenter never translates').toBe(0);
        expect(initial.scale, 'popCenter grows from the centre').toBeLessThan(1);
      } else if (/Left|Right/.test(name)) {
        expect(initial.x, `${name} slides on X`).not.toBe(0);
        expect(initial.y ?? 0, `${name} must not move on Y`).toBe(0);
      } else {
        expect(initial.y, `${name} slides on Y`).not.toBe(0);
        expect(initial.x ?? 0, `${name} must not move on X`).toBe(0);
      }
    }
  });

  /**
   * An animated toast SETTLES: after the enter phase the card must sit at
   * full opacity with an identity transform — the preset moves it, it never
   * parks it off-position.
   */
  test('Toast/slide-bottom-right animates in and settles at rest', async ({ page }) => {
    await page.goto(storyUrl('primitives-toast--slide-bottom-right'));
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    await expect
      .poll(
        () =>
          toast.evaluate((el) => {
            const s = getComputedStyle(el);
            return { opacity: Number(s.opacity), transform: s.transform };
          }),
        { message: 'toast settles at opacity 1, identity transform' },
      )
      .toEqual({ opacity: 1, transform: expect.stringMatching(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/) });
  });

  /**
   * Long tooltips stay BOUNDED (user report: they offset the app view):
   * the bubble caps at max-w-64 (256px) and wraps to multiple lines.
   * (CSS-only tooltip: the element exists at opacity 0, so it measures
   * without hovering.)
   */
  test('Tooltip long label wraps inside its 256px boundary', async ({ page }) => {
    await page.goto(storyUrl('primitives-tooltip--long-label-wraps'));
    await page.getByRole('button', { name: 'Why?' }).hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    const m = await tip.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const line = Number.parseFloat(getComputedStyle(el).lineHeight);
      return { width: r.width, height: r.height, line };
    });
    expect(m.width, 'bubble respects the max-width boundary').toBeLessThanOrEqual(256.5);
    expect(m.height, 'copy wraps onto multiple lines').toBeGreaterThan(m.line * 1.9);
  });

  /**
   * IconButton mirrors Button's `rounded` boolean — the toolbar-pill shape —
   * and Menu forwards it to its built-in overflow trigger.
   */
  test('IconButton/rounded and Menu rounded trigger are pills', async ({ page }) => {
    await page.goto(storyUrl('primitives-iconbutton--rounded'));
    const btn = page.getByRole('button').first();
    await expect(btn).toBeVisible();
    const b = await btn.evaluate((el) => ({
      h: el.getBoundingClientRect().height,
      r: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
    }));
    expect(b.r, 'rounded icon button is a pill').toBeGreaterThanOrEqual(b.h / 2 - 1);

    await page.goto(storyUrl('primitives-menu--rounded-trigger'));
    const trigger = page.getByRole('button', { name: 'More actions' });
    await expect(trigger).toBeVisible();
    const t = await trigger.evaluate((el) => ({
      h: el.getBoundingClientRect().height,
      r: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
    }));
    expect(t.r, 'menu forwards rounded to its trigger').toBeGreaterThanOrEqual(t.h / 2 - 1);
  });

  /**
   * Button `outline` is a boolean like `rounded` (they coexist): transparent
   * fill with the variant's colour moved into the border — and hovering still
   * swaps in an alternative background so the affordance never disappears.
   */
  test('Button/outline drops the fill into an accent border and keeps a hover bg', async ({
    page,
  }) => {
    await page.goto(storyUrl('primitives-button--outline'));
    const btn = page.getByRole('button').first();
    await expect(btn).toBeVisible();
    const rest = await btn.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, borderColor: s.borderTopColor, borderW: Number.parseFloat(s.borderTopWidth) };
    });
    expect(rest.bg, 'outline rest is transparent').toBe('rgba(0, 0, 0, 0)');
    expect(rest.borderColor, 'border carries the variant (accent) colour').toBe(
      hexToRgb(RUI['--rui-accent']),
    );
    expect(rest.borderW, 'a real 1px border').toBeGreaterThanOrEqual(1);

    await btn.hover();
    await expect
      .poll(() => btn.evaluate((el) => getComputedStyle(el).backgroundColor), {
        message: 'hover swaps in an alternative background',
      })
      .not.toBe(rest.bg);
  });

  /**
   * The spacing bridge is COMPLETE for every step components actually use:
   * rui-5/6/8 exist (Modal pads p-rui-6, EmptyState px-rui-6 py-rui-8) —
   * without them the utilities silently emit nothing and content lands flush
   * on the panel edges (the reported bug). Assert the Modal panel's real
   * computed padding.
   */
  test('Modal panel really pads 24px (spacing tokens 5/6/8 exist)', async ({ page }) => {
    expect(RUI['--rui-space-5'], 'space-5 token').toBe('20px');
    expect(RUI['--rui-space-6'], 'space-6 token').toBe('24px');
    expect(RUI['--rui-space-8'], 'space-8 token').toBe('32px');

    await page.goto(storyUrl('primitives-modal--when-to-pay'));
    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();
    const pad = await modal.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(pad, 'panel padding is the rui-6 step, not 0').toBe('24px');
  });

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

  /**
   * Product-overview snapshot 13 ("Any Admin" chip) at 8x zoom — the stack
   * runs deepest → closest: each LATER avatar bites into the one before it
   * (orange "J" over green "M", "+3" over "J"). Hit-test the overlap seam:
   * the topmost element there must belong to the SECOND avatar. This is the
   * inverse of the old (invented) z-index order.
   */
  test('UserAvatars stacks deepest → closest (later avatar paints on top)', async ({ page }) => {
    await page.goto(storyUrl('primitives-useravatars--approval-chain'));
    const avatars = page.getByTestId('stacked-avatar');
    await expect(avatars.first()).toBeVisible();
    const second = await avatars.nth(1).boundingBox();
    expect(second).not.toBeNull();
    if (!second) return;
    // Left edge of the second circle at mid-height — inside the seam where
    // both circles overlap, so whoever wins the hit-test is on top.
    const seam: [number, number] = [second.x + 2, second.y + second.height / 2];
    const laterWins = await page.evaluate(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      const stack = document.querySelectorAll('[data-testid="stacked-avatar"]');
      return stack[1]?.contains(hit) ?? false;
    }, seam);
    expect(laterWins, 'the later avatar covers the earlier one at the seam').toBe(true);
  });

  /**
   * Money's `locale` prop drives the group/decimal separator ORDER, not just
   * the symbol: the same cents render "12,345.67" (en-US) and "12.345,67"
   * (de-DE / es-AR) side by side in the LocaleSeparators story.
   */
  test('Money locale flips the , / . separator order', async ({ page }) => {
    await page.goto(storyUrl('primitives-money--locale-separators'));
    const root = page.locator('#storybook-root');
    await expect(root, 'en-US: comma groups, dot decimals').toContainText('12,345.67');
    await expect(root, 'de-DE: dot groups, comma decimals').toContainText('12.345,67');
  });

  /**
   * Product-overview snapshot 13 — the "Pay with Ramp Card" accordion row:
   * white surface, ink heading + hushed subtitle, thin caret on the right;
   * the row toggles an aria-wired region. Design iteration: the item is a
   * BOXED row — the header button carries a full stone border; while open
   * its bottom edge drops (border-b-0) so the canvas content region (its own
   * stone border, sans top) completes the box. Closed again, the header's
   * bottom hairline returns.
   */
  test('Accordion matches snapshot 13 (hushed subtitle, boxed stone border, toggling region)', async ({
    page,
  }) => {
    await page.goto(storyUrl('primitives-accordion--pay-with-ramp-card'));
    const row = page.getByRole('button', { name: /Pay with Ramp Card/ });
    await expect(row).toBeVisible();
    await expect(row, 'open by default like the frame').toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('region')).toBeVisible();

    const subtitle = page.getByText(
      'Create a single-use virtual card number you can use for this bill',
    );
    await expect(subtitle, 'subtitle is the hushed gray').toHaveCSS(
      'color',
      hexToRgb(RUI['--rui-hushed']),
    );

    // The header button owns the box: 1px stone on top/left/right, and while
    // OPEN its bottom edge is dropped so the content region completes the
    // frame with its own stone border (sans top). The wrapper draws nothing.
    const openBorders = await row.evaluate((el) => {
      const s = getComputedStyle(el);
      const parent = getComputedStyle(el.parentElement as Element);
      return {
        topColor: s.borderTopColor,
        topWidth: Number.parseFloat(s.borderTopWidth),
        leftWidth: Number.parseFloat(s.borderLeftWidth),
        bottomWidth: Number.parseFloat(s.borderBottomWidth),
        parentWidth: Number.parseFloat(parent.borderBottomWidth),
      };
    });
    expect(openBorders.topColor, 'stone border frames the header row').toBe(
      hexToRgb(RUI['--rui-stone']),
    );
    expect(openBorders.topWidth, 'top border is 1px').toBe(1);
    expect(openBorders.leftWidth, 'side border is 1px').toBe(1);
    expect(openBorders.bottomWidth, 'open header hands its bottom edge to the content').toBe(0);
    expect(openBorders.parentWidth, 'item wrapper draws no border of its own').toBe(0);

    // The open content region sits on the canvas tint and closes the box
    // with its own stone border, minus the top edge (the header abuts it).
    const region = page.getByRole('region');
    await expect(region, 'content region sits on the canvas tint').toHaveCSS(
      'background-color',
      hexToRgb(RUI['--rui-canvas']),
    );
    await expect(region).toHaveCSS('border-bottom-color', hexToRgb(RUI['--rui-stone']));
    await expect(region, 'no top border — the header abuts the content').toHaveCSS(
      'border-top-width',
      '0px',
    );

    await row.click();
    await expect(row).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('region'), 'content unmounts after the exit').toBeHidden();

    // Closed again, the header's bottom hairline returns to complete the box.
    const closedBottom = await row.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).borderBottomWidth),
    );
    expect(closedBottom, 'closed header restores its bottom hairline').toBe(1);
  });

  /**
   * Product-overview snapshot 12 — `[ New card | Existing card ]`: stone
   * strip with a bone hairline, sharp corners, and ONE white plate (hushed
   * hairline) that glides to whichever segment is selected via shared layout.
   */
  test('SegmentedControl: stone strip, single gliding white plate', async ({ page }) => {
    await page.goto(storyUrl('primitives-segmentedcontrol--pay-by-card'));
    const strip = page.getByRole('tablist');
    await expect(strip).toHaveCSS('background-color', hexToRgb(RUI['--rui-stone']));
    await expect(strip, 'sharp corners').toHaveCSS('border-top-left-radius', '0px');
    await expect(strip).toHaveCSS('border-top-color', hexToRgb(RUI['--rui-bone']));

    const plate = page.getByTestId('segment-plate');
    await expect(plate, 'exactly one shared plate').toHaveCount(1);
    await expect(plate).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(plate, 'selected hairline is the darker hushed').toHaveCSS(
      'border-top-color',
      hexToRgb(RUI['--rui-hushed']),
    );

    // Click the other segment: still ONE plate, and it settles under it.
    const target = page.getByRole('tab', { name: 'Existing card' });
    await target.click();
    await expect(plate).toHaveCount(1);
    await expect
      .poll(async () => {
        const plateBox = await plate.boundingBox();
        const tabBox = await target.boundingBox();
        return plateBox && tabBox ? Math.abs(plateBox.x - tabBox.x) : Number.POSITIVE_INFINITY;
      }, 'plate glides to the selected segment')
      .toBeLessThan(2);
  });

  /**
   * SegmentedArea = the control fronting a tabpanel (snapshot 12's panel):
   * selecting a segment swaps the content under it. Design iteration: the
   * canvas tint (#fbfaf6, --rui-canvas) + rui-3 insets now live on the
   * TABPANEL itself — the strip sits flush on top and the wrapper stays
   * transparent, so only the content band reads tinted against the white
   * panel around it.
   */
  test('SegmentedArea swaps the panel under the control', async ({ page }) => {
    await page.goto(storyUrl('primitives-segmentedarea--pay-by-card'));

    // The tabpanel carries the vetted canvas tint + insets; the wrapper
    // around the strip draws nothing of its own.
    const panel = page.getByTestId('segmented-area-panel');
    await expect(panel, 'panel sits on the canvas tint').toHaveCSS(
      'background-color',
      hexToRgb(RUI['--rui-canvas']),
    );
    await expect(panel, 'content insets from the tinted edges').toHaveCSS(
      'padding-top',
      RUI['--rui-space-3'],
    );
    await expect(panel).toContainText('Pay automatically');
    await page.getByRole('tab', { name: 'Existing card' }).click();
    await expect(panel).toContainText('Choose one of your issued Ramp cards');
    await page.getByRole('tab', { name: 'New card' }).click();
    await expect(panel).toContainText('Send card to vendor');
  });
});
