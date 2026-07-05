import { expect, test } from '@playwright/test';

import { hexToRgb, RUI } from './tokens.fixture';

/**
 * SIDEMENU FIDELITY — the SideMenu primitive validation spec.
 *
 * This spec validates the SideMenu component (packages/ui/src/components/SideMenu/
 * SideMenu.tsx): the product's left navigation sidebar with items, badges, dividers.
 *
 * All color/structure measurements vetted against:
 *  - docs/watch-youtube/does-ramp-live-up-to-the-hype…/01-home-dashboard-left-nav.jpeg
 *  - docs/watch-youtube/ramp-bill-pay-product-overview/snapshots/02-fraud-duplicate-warnings.jpeg
 *  - docs/watch-youtube/ramp-bill-pay-product-overview/snapshots/16-for-payment-tab.jpeg
 *  - docs/watch-youtube/ramp-bill-pay-series-ap-agent/snapshots/1.jpeg
 *
 * Hard-gate assertions (blocks the push):
 *  - Nav container background: LIMESTONE (vetted #f0efeb–#f1f0ec across all frames).
 *  - Active item background: STONE (vetted #e5e0dc at frame-02 x80-100 y230).
 *  - Active item text: INK (vetted #0b0704–#2c2825 at frame-02 x45-50 y230).
 *  - Inactive item text: HUSHED (vetted #6f6e6a at frame-02 x45-50 y169).
 *  - Badge background: ACCENT (vetted #fbff85–#f8ff77 at frame-02 x160-165 y65/302).
 *  - Badge text: INK (high contrast on lime).
 *  - Corners: 0px (rounded-square) on nav container and items (vetted 5x zoom);
 *    badges are PILLS by design decision (matching the Tabs count badges).
 *  - Divider: bone hairline (INFERRED, standard neutral divider token).
 */

/** Storybook static: render a single story chrome-free. */
function storyUrl(id: string): string {
  return `/iframe.html?id=${id}&viewMode=story`;
}

test.describe('SideMenu fidelity (vetted against product frames)', () => {
  /**
   * Nav container background is LIMESTONE — vetted at 1px sampling across all
   * frames showing the nav (product-overview/02 x40-60 y100-180): #f0efeb–#f1f0ec.
   */
  test('Nav container background is limestone (vetted #f0efeb–#f1f0ec)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const nav = page.locator('nav[aria-label*="navigation"]').first();
    await expect(nav).toBeVisible();
    const bg = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg, 'nav background is limestone').toBe(hexToRgb(RUI['--rui-limestone']));
  });

  /**
   * Active item background is STONE — vetted at 1px sampling in product-overview/02
   * at x80-100 y230 (Bill Pay active item): #e5e0dc.
   */
  test('Active item background is stone (vetted #e5e0dc)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const activeItem = page.locator('a[aria-current="page"], button[aria-current="page"]').first();
    await expect(activeItem).toBeVisible();
    const bg = await activeItem.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg, 'active item background is stone').toBe(hexToRgb(RUI['--rui-stone']));
  });

  /**
   * Active item text is INK — vetted at product-overview/02 x45-50 y230: #0b0704–#2c2825.
   */
  test('Active item text is ink (vetted #0b0704–#2c2825)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const activeItem = page.locator('a[aria-current="page"], button[aria-current="page"]').first();
    await expect(activeItem).toBeVisible();
    const color = await activeItem.evaluate((el) => getComputedStyle(el).color);
    expect(color, 'active item text is ink').toBe(hexToRgb(RUI['--rui-ink']));
  });

  /**
   * Inactive item text is HUSHED — vetted at product-overview/02 x45-50 y169: #6f6e6a.
   */
  test('Inactive item text is hushed (vetted #6f6e6a)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    // Find the first item that is NOT active (e.g. Home, Insights, etc.)
    const inactiveItem = page
      .locator('nav li a, nav li button')
      .filter({ hasNotText: 'Bill Pay' })
      .first();
    await expect(inactiveItem).toBeVisible();
    const color = await inactiveItem.evaluate((el) => getComputedStyle(el).color);
    expect(color, 'inactive item text is hushed').toBe(hexToRgb(RUI['--rui-hushed']));
  });

  /**
   * Badge background is ACCENT (lime) — vetted at product-overview/02 x160-165 y65/302:
   * #fbff85–#f8ff77 (JPEG-inflated, but unmistakably the accent lime family).
   */
  test('Badge background is accent (vetted #fbff85–#f8ff77)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    // Home has badge 90
    const badge = page.locator('nav li').filter({ hasText: 'Home' }).locator('span[aria-label]').first();
    await expect(badge).toBeVisible();
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg, 'badge background is accent').toBe(hexToRgb(RUI['--rui-accent']));
  });

  /**
   * Badge text is INK — high contrast on the lime accent background.
   */
  test('Badge text is ink', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const badge = page.locator('nav li').filter({ hasText: 'Home' }).locator('span[aria-label]').first();
    await expect(badge).toBeVisible();
    const color = await badge.evaluate((el) => getComputedStyle(el).color);
    expect(color, 'badge text is ink').toBe(hexToRgb(RUI['--rui-ink']));
  });

  /**
   * Nav container has 0px corners (rounded-square) — vetted at 5x zoom across all frames.
   */
  test('Nav container has 0px corners (rounded-square)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const nav = page.locator('nav[aria-label*="navigation"]').first();
    await expect(nav).toBeVisible();
    const radius = await nav.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(radius, 'nav container corner is 0px').toBeLessThanOrEqual(1);
  });

  /**
   * Menu items have 0px corners (rounded-square) — vetted across all frames.
   */
  test('Menu items have 0px corners (rounded-square)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const item = page.locator('nav li a, nav li button').first();
    await expect(item).toBeVisible();
    const radius = await item.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopLeftRadius));
    expect(radius, 'menu item corner is 0px').toBeLessThanOrEqual(1);
  });

  /**
   * Badge is a fully-rounded PILL — DESIGN DECISION (user direction): the nav
   * counts share the pill shape of the Tabs bar's count badges, superseding
   * the earlier 0px frame reading. Pill = radius >= half the rendered height.
   */
  test('Badge is a pill (fully rounded, like the Tabs count badges)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const badge = page.locator('nav li').filter({ hasText: 'Home' }).locator('span[aria-label]').first();
    await expect(badge).toBeVisible();
    const { radius, height } = await badge.evaluate((el) => ({
      radius: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
      height: el.getBoundingClientRect().height,
    }));
    expect(radius, 'badge corner is a pill radius').toBeGreaterThanOrEqual(height / 2 - 1);
  });

  /**
   * Divider is a bone hairline (border-bone) — INFERRED, the standard neutral divider
   * token used throughout the design system.
   */
  test('Divider is a bone hairline (INFERRED)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--with-divider'));
    const divider = page.locator('nav hr').first();
    await expect(divider).toBeVisible();
    const borderColor = await divider.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(borderColor, 'divider is bone').toBe(hexToRgb(RUI['--rui-bone']));
  });

  /**
   * Active item has aria-current="page" for accessibility — marks the current page
   * in the navigation landmark.
   */
  test('Active item has aria-current="page"', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const activeItem = page.locator('[aria-current="page"]').first();
    await expect(activeItem).toBeVisible();
    await expect(activeItem).toHaveText(/Bill Pay/);
  });

  /**
   * Badge count is visible and correct — renders the number inside the accent pill.
   */
  test('Badge count renders correctly', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    // Home badge: 90
    const homeBadge = page.locator('nav li').filter({ hasText: 'Home' }).locator('span[aria-label]').first();
    await expect(homeBadge).toBeVisible();
    await expect(homeBadge).toHaveText('90');
    await expect(homeBadge).toHaveAttribute('aria-label', '90 items');

    // Accounting badge: 383
    const accountingBadge = page
      .locator('nav li')
      .filter({ hasText: 'Accounting' })
      .locator('span[aria-label]')
      .first();
    await expect(accountingBadge).toBeVisible();
    await expect(accountingBadge).toHaveText('383');
  });

  /**
   * Icon is rendered and visible — all items in the replica have leading icons.
   */
  test('Icons render for menu items', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const homeItem = page.locator('nav li').filter({ hasText: 'Home' }).locator('a, button').first();
    await expect(homeItem).toBeVisible();
    // Icon is aria-hidden and rendered as an SVG (Lucide icons)
    const icon = homeItem.locator('span[aria-hidden] svg').first();
    await expect(icon).toBeVisible();
  });

  /**
   * Nav uses semantic HTML: <nav> with <ul> and <li> — proper landmark and list
   * semantics for screen readers.
   */
  test('Nav uses semantic HTML (nav > ul > li)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const nav = page.locator('nav[aria-label*="navigation"]').first();
    await expect(nav).toBeVisible();
    const ul = nav.locator('ul').first();
    await expect(ul).toBeVisible();
    const liCount = await ul.locator('li').count();
    expect(liCount, 'nav has multiple list items').toBeGreaterThan(5);
  });

  /**
   * Font weight is body (300) — the frames show light text on the nav items, matching
   * the body token (--rui-font-weight-body: 300).
   */
  test('Menu items use body font weight (300)', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const item = page.locator('nav li a, nav li button').first();
    await expect(item).toBeVisible();
    const itemText = item.locator('span').filter({ hasText: /Home|Bill Pay/ }).first();
    const fontWeight = await itemText.evaluate((el) => getComputedStyle(el).fontWeight);
    // Font weight 300 can be reported as "300" or computed as numeric 300
    expect(['300'].includes(fontWeight), `font-weight is 300 (got: ${fontWeight})`).toBe(true);
  });

  /**
   * INFERRED: Inactive item hover background is limestone — consistent with the design
   * system's hover treatment (Button/Menu use limestone hover on neutral surfaces).
   */
  test('INFERRED: Inactive item hover background is limestone', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const inactiveItem = page
      .locator('nav li a, nav li button')
      .filter({ hasNotText: 'Bill Pay' })
      .first();
    await expect(inactiveItem).toBeVisible();

    // Hover over the item; toHaveCSS retries until the 150ms color
    // transition settles (a one-shot evaluate can catch the mid-fade rgba).
    await inactiveItem.hover();
    await expect(inactiveItem, 'inactive item hover bg is limestone').toHaveCSS(
      'background-color',
      hexToRgb(RUI['--rui-limestone']),
    );
  });

  /**
   * Active item hover background stays stone (no change on hover) — the active item
   * is already highlighted, so hover doesn't change the background.
   */
  test('Active item hover background stays stone', async ({ page }) => {
    await page.goto(storyUrl('primitives-sidemenu--ramp-bill-pay-replica'));
    const activeItem = page.locator('[aria-current="page"]').first();
    await expect(activeItem).toBeVisible();

    // Hover over the active item
    await activeItem.hover();
    await page.waitForTimeout(100);

    // Background should still be stone
    const bg = await activeItem.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg, 'active item hover bg stays stone').toBe(hexToRgb(RUI['--rui-stone']));
  });

  /**
   * Interactive onClick story logs to console — verify the click handler is wired.
   */
  test('Interactive story fires onClick handlers', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') logs.push(msg.text());
    });

    await page.goto(storyUrl('primitives-sidemenu--interactive'));
    const homeItem = page.locator('nav li').filter({ hasText: 'Home' }).locator('button').first();
    await expect(homeItem).toBeVisible();
    await homeItem.click();
    await page.waitForTimeout(100);

    expect(logs.some((log) => log.includes('Navigate to Home')), 'onClick fired for Home').toBe(
      true,
    );
  });
});
