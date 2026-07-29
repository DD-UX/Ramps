import { expect, test } from '@playwright/test';

import { hexToRgb, RUI } from './rui.fixture';

/**
 * COMMAND-PALETTE FIDELITY — the regression home for a class of bug the other
 * tiers structurally cannot see.
 *
 * The palette shipped with ↑/↓ "broken". They were not broken: `activeIndex`
 * advanced, `aria-activedescendant` re-pointed, `aria-selected` moved — every
 * assertion a jsdom unit test can make was already true and already green.
 * What failed was PAINT. The active-row highlight is an `absolute inset-0
 * -z-10` fill, and its row was `relative` only. `position: relative` does NOT
 * open a stacking context, so a negatively-stacked child escapes upward to the
 * nearest ancestor that does — here the `fixed z-50` scrim — and lands BEHIND
 * the panel's own white background. Invisible highlight, arrows that look dead.
 *
 * Nothing in the unit tier could catch that: `packages/ui`'s vitest is
 * node-only, and jsdom has no layout, no compositing and no stacking contexts.
 * Only a real engine knows where a `-z-10` box ends up. Hence this spec, in the
 * blocking `token-fidelity` project (the `*fidelity.spec.ts` match), so the
 * regression cannot reach main again.
 *
 * The assertions are deliberately CAUSAL rather than cosmetic. Asserting
 * `isolation: isolate` alone would only restate the fix; instead we walk the
 * highlight's ancestors and prove the first stacking context above it IS its
 * own row — the precise property that was false before, and the one that stays
 * true no matter which CSS mechanism a future refactor uses to establish it.
 */

function storyUrl(id: string): string {
  return `/iframe.html?id=${id}&viewMode=story`;
}

test.describe('command palette fidelity', () => {
  /**
   * THE REGRESSION. The highlight must be contained by the row it highlights:
   * the nearest stacking context above the `-z-10` fill is the active option
   * itself, so the fill paints over the panel's white and under the row's own
   * label — not behind the whole sheet.
   */
  test('the active-row highlight is stacked INSIDE its row, not behind the panel', async ({
    page,
  }) => {
    await page.goto(storyUrl('primitives-commandpalette--with-results'));

    const highlight = page.getByTestId('command-palette-highlight');
    await expect(highlight, 'exactly one shared lozenge').toHaveCount(1);
    await expect(highlight).toBeVisible();

    // Walk up from the fill to the first ancestor that establishes a stacking
    // context. A DOM node cannot cross the Playwright boundary, so the walker
    // reports the element's role/testid instead of the node itself.
    const root = await highlight.evaluate((el) => {
      const creates = (node: Element): boolean => {
        const s = getComputedStyle(node);
        if (s.isolation === 'isolate') return true;
        if (s.transform !== 'none' || s.filter !== 'none' || s.perspective !== 'none') return true;
        if (Number(s.opacity) < 1) return true;
        if (s.mixBlendMode !== 'normal') return true;
        if (s.position === 'fixed' || s.position === 'sticky') return true;
        if (s.position !== 'static' && s.zIndex !== 'auto') return true;
        if (/paint|layout|strict|content/.test(s.contain)) return true;
        if (/transform|opacity|filter/.test(s.willChange)) return true;
        return false;
      };
      let node = el.parentElement;
      while (node && node !== document.documentElement) {
        if (creates(node)) {
          return node.getAttribute('data-testid') ?? node.getAttribute('role') ?? node.tagName;
        }
        node = node.parentElement;
      }
      return 'ROOT';
    });
    expect(root, 'the fill is trapped inside its own row').toBe('option');

    await expect(highlight, 'the lozenge is the limestone wash').toHaveCSS(
      'background-color',
      hexToRgb(RUI['--rui-limestone']),
    );
  });

  /**
   * And the selection must be VISIBLE — the half no DOM query can answer.
   *
   * `elementFromPoint` is useless here: hit-testing ignores paint order, so it
   * happily returned the active row while the fill was buried behind the sheet.
   * The only witness to "did it paint" is the rasteriser. So: screenshot the
   * same left-padding strip (clear of icon and label — pure background) on the
   * active row and on its neighbour, and require the two rasters to DIFFER.
   * Comparing PNG buffers needs no decoder and no golden file; identical bytes
   * mean identical pixels, which means the user sees no selection at all.
   */
  test('the selected row rasterises differently from an unselected one', async ({ page }) => {
    await page.goto(storyUrl('primitives-commandpalette--with-results'));

    const rows = page.locator('[role="option"]');
    const activeRow = page.locator('[role="option"][aria-selected="true"]');
    await expect(activeRow).toHaveCount(1);

    // The sheet SCALES in. Geometry read mid-flight is fractional and drifting,
    // which would hand the two clips different sizes — and different-sized PNGs
    // never match, so the test would "pass" without ever comparing a colour.
    // Wait until the row's box stops moving before measuring anything.
    const boxOf = () => activeRow.evaluate((el) => JSON.stringify(el.getBoundingClientRect()));
    await expect
      .poll(
        async () => {
          const before = await boxOf();
          await new Promise((r) => setTimeout(r, 100));
          return (await boxOf()) === before;
        },
        { message: 'the enter animation settles before we measure' },
      )
      .toBe(true);

    const active = await activeRow.boundingBox();
    const neighbour = await rows.nth(1).boundingBox();
    expect(active, 'the active row has a box').not.toBeNull();
    expect(neighbour, 'the neighbouring row has a box').not.toBeNull();
    if (!active || !neighbour) return;

    // ONE clip geometry, moved down by one row: identical width and height, so
    // the only thing that can differ between the two PNGs is colour. The strip
    // is 6px of the row's left padding — clear of the icon and the label, pure
    // background, which is precisely the layer the highlight is supposed to be.
    const width = 6;
    const height = Math.round(active.height) - 4;
    const x = Math.round(active.x) + 2;
    const strip = (top: number) =>
      page.screenshot({ clip: { x, y: Math.round(top) + 2, width, height } });

    const selected = await strip(active.y);
    const unselected = await strip(neighbour.y);
    expect(
      selected.equals(unselected),
      'the highlight paints — a selected row does not look identical to an unselected one',
    ).toBe(false);
  });

  /**
   * ↑/↓ move the SAME lozenge (shared layout) onto whichever row
   * `aria-selected` now names, and the ring wraps rather than dead-ending.
   *
   * Note what this test does NOT prove: it was green throughout the outage,
   * because geometry and ARIA were always correct — only paint was wrong.
   * That is the point of keeping the two apart. This one owns "does the
   * selection MOVE"; the raster test above owns "can you SEE it". Either alone
   * is a half-truth, and the half we shipped on was this one.
   */
  test('↑/↓ carry the single highlight onto the newly selected row', async ({ page }) => {
    await page.goto(storyUrl('primitives-commandpalette--with-results'));

    const field = page.getByRole('combobox');
    await expect(field).toBeFocused();

    const rows = page.locator('[role="option"]');
    const count = await rows.count();
    expect(count, 'the story renders a walkable list').toBeGreaterThan(2);

    /** The active row's index, and how far the lozenge sits from its top. */
    const state = async () =>
      page.evaluate(() => {
        const all = [...document.querySelectorAll('[role="option"]')];
        const row = document.querySelector('[role="option"][aria-selected="true"]');
        const fill = document.querySelector('[data-testid="command-palette-highlight"]');
        if (!row || !fill) return null;
        return {
          index: all.indexOf(row),
          drift: Math.abs(row.getBoundingClientRect().y - fill.getBoundingClientRect().y),
          fills: document.querySelectorAll('[data-testid="command-palette-highlight"]').length,
        };
      });

    const first = await state();
    expect(first?.index, 'the first row starts active').toBe(0);

    await page.keyboard.press('ArrowDown');
    await expect.poll(async () => (await state())?.index, 'ArrowDown advances').toBe(1);
    await expect
      .poll(async () => (await state())?.drift, 'the lozenge settles on the new row')
      .toBeLessThan(1.5);
    expect((await state())?.fills, 'one lozenge glided — it did not clone').toBe(1);

    await page.keyboard.press('ArrowUp');
    await expect.poll(async () => (await state())?.index, 'ArrowUp retreats').toBe(0);
    await expect
      .poll(async () => (await state())?.drift, 'the lozenge follows back')
      .toBeLessThan(1.5);

    // Wrap: up from the first row lands on the last, so the list is a ring and
    // the keyboard never dead-ends.
    await page.keyboard.press('ArrowUp');
    await expect
      .poll(async () => (await state())?.index, '↑ from the top wraps to the end')
      .toBe(count - 1);
  });

  /**
   * A navigational row is a REAL anchor (see the anchor rule on the component):
   * Enter clicks it rather than calling a handler, so the keyboard and the
   * mouse take one identical path through the app's unsaved-changes guard, the
   * router and prefetch. Assert the element type, because the guarantee is
   * structural — a `<button>` here would silently bypass the guard.
   */
  test('navigational rows are anchors carrying a real href', async ({ page }) => {
    await page.goto(storyUrl('primitives-commandpalette--with-results'));
    const row = page.locator('[role="option"]').first();
    expect(await row.evaluate((el) => el.tagName), 'a row is an anchor').toBe('A');
    expect(await row.getAttribute('href'), 'the anchor names a destination').toBeTruthy();
  });
});
