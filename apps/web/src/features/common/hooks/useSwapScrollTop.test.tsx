import { render } from '@testing-library/react';
import { type RefObject, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSwapScrollTop } from './useSwapScrollTop';

/**
 * useSwapScrollTop carries a scroll container's scrollTop across a keyed
 * content swap (first consumer: the bill-details left pane across rail
 * hops): the outgoing mount's cleanup parks the offset in a ref owned above
 * the keyed boundary, the incoming mount starts the fresh container there
 * and glides it to the top with native smooth scroll. These tests pin the
 * legs of that contract — capture on unmount, restore + glide on a carried
 * mount, and the two "no travel" paths (nothing carried; reduced motion).
 *
 * jsdom neither lays out nor scrolls, so the pane's scroll surface is stubbed:
 * `scrollTop` becomes a plain stored value (jsdom's own accessor pins it to 0)
 * and `scrollTo` a spy. `matchMedia` is stubbed per-test to steer the
 * reduced-motion gate.
 */

// WeakMap-backed scrollTop shadowing jsdom's always-0 accessor.
const scrollTops = new WeakMap<object, number>();
const scrollTo = vi.fn();

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get(this: object) {
      return scrollTops.get(this) ?? 0;
    },
    set(this: object, value: number) {
      scrollTops.set(this, value);
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: scrollTo,
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  );
});

afterEach(() => {
  // Delete the shadows so jsdom's own Element.prototype accessors resurface.
  delete (HTMLElement.prototype as { scrollTop?: unknown }).scrollTop;
  delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
  scrollTo.mockReset();
  vi.unstubAllGlobals();
});

/** One keyed mount: a scroller div + the hook, like BillDetailsBody's wiring. */
function Harness({ carried }: { carried: RefObject<number> }) {
  const paneRef = useRef<HTMLDivElement>(null);
  useSwapScrollTop(paneRef, carried);
  return <div data-testid="pane" ref={paneRef} />;
}

describe('useSwapScrollTop', () => {
  it('captures the pane offset into the carried ref on unmount', () => {
    const carried = { current: 0 };
    const { getByTestId, unmount } = render(<Harness carried={carried} />);

    // The user scrolls, then hops away.
    getByTestId('pane').scrollTop = 600;
    unmount();

    expect(carried.current).toBe(600);
  });

  it('starts a carried mount at the parked offset and glides to the top', () => {
    const carried = { current: 600 };
    const { getByTestId } = render(<Harness carried={carried} />);

    // Restored before paint, then handed to native smooth scroll.
    expect(getByTestId('pane').scrollTop).toBe(600);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    // Consumed: a ladder-driven re-render must not replay the glide.
    expect(carried.current).toBe(0);
  });

  it('does nothing on a mount with no carried offset (cold deep link)', () => {
    const carried = { current: 0 };
    const { getByTestId } = render(<Harness carried={carried} />);

    expect(getByTestId('pane').scrollTop).toBe(0);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('skips the travel entirely under prefers-reduced-motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const carried = { current: 600 };
    const { getByTestId } = render(<Harness carried={carried} />);

    // Lands at the top instantly — today's behavior, no glide.
    expect(getByTestId('pane').scrollTop).toBe(0);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('chains rapid hops: a mid-glide unmount re-parks the current offset', () => {
    const carried = { current: 600 };
    const { getByTestId, unmount } = render(<Harness carried={carried} />);

    // The glide is underway (pane restored to 600); the user hops again
    // mid-travel — simulate the browser having walked it down to 250.
    getByTestId('pane').scrollTop = 250;
    unmount();

    expect(carried.current).toBe(250);
  });
});
