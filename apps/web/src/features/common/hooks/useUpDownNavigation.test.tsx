import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type UpDownNavigationItem,
  useUpDownNavigation,
  type UseUpDownNavigationOptions,
} from './useUpDownNavigation';

/**
 * useUpDownNavigation drives a debounced ↑/↓ pointer over a list of `{id, href}`
 * rows and COMMITS a settled skim by CLICKING that row's real anchor (the
 * caller's own `<Link>`, found via `resolveAnchor`). One click is the whole hop
 * — the framework's soft nav AND any document nav-guard's chance to veto. These
 * tests assert:
 *  - prev/next math and the OPTIMISTIC pointer step,
 *  - a fast run of presses clicks ONCE, the LAST row's anchor, after the debounce,
 *  - a guard veto (a capture listener that `stopPropagation`s the anchor click)
 *    leaves the pointer un-navigated and snaps it back to the current row,
 *  - a landed navigation (the `activeId` prop changing) re-syncs the pointer to
 *    the SAME row it names — never snapping to an end,
 *  - the keys stay off while typing / disabled.
 *
 * The debounce runs on fake timers. Each row gets a REAL jsdom `<a>` in the
 * document; `resolveAnchor` returns it and a `click` spy records the commit. A
 * test may install a `guard` — a document CAPTURE listener that
 * `preventDefault`+`stopPropagation`s the click — to model the unsaved-changes
 * veto without a router (a real anchor's default nav is a jsdom no-op anyway).
 */
const ITEMS: UpDownNavigationItem[] = [
  { id: 'a', href: '/bills/a' },
  { id: 'b', href: '/bills/b' },
  { id: 'c', href: '/bills/c' },
  { id: 'd', href: '/bills/d' },
];

type Props = Omit<UseUpDownNavigationOptions, 'items' | 'resolveAnchor'> & {
  items?: UpDownNavigationItem[];
};

function press(key: 'ArrowDown' | 'ArrowUp', target?: EventTarget) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  (target ?? document).dispatchEvent(event);
  return event;
}

/**
 * Mount a real `<a>` per item in the document and drive the hook with a
 * `resolveAnchor` that returns them. Each anchor's click bubbles to a document
 * listener that records WHICH href committed — the stand-in for a navigation.
 */
function renderNav(options: Props) {
  const anchors = new Map<string, HTMLAnchorElement>();
  const items = options.items ?? ITEMS;
  for (const item of items) {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', item.href);
    // jsdom would "navigate" to href on click and warn — neuter the default so
    // the test only observes propagation (what a guard/soft-nav would act on).
    anchor.addEventListener('click', (event) => event.preventDefault());
    document.body.appendChild(anchor);
    anchors.set(item.id, anchor);
  }

  const committed: string[] = [];
  const onCommit = (event: Event) => {
    const anchor = event.target as HTMLAnchorElement;
    committed.push(anchor.getAttribute('href') ?? '');
  };
  document.addEventListener('click', onCommit);

  const resolveAnchor = (id: string) => anchors.get(id) ?? null;

  const utils = renderHook(
    (props: Props) => useUpDownNavigation({ items: props.items ?? ITEMS, resolveAnchor, ...props }),
    { initialProps: options },
  );

  return {
    ...utils,
    nav: () => utils.result.current,
    /** The hrefs whose anchors reached the document — i.e. committed hops. */
    committed,
    teardown: () => document.removeEventListener('click', onCommit),
  };
}

/** Install a dirty-form guard: a document CAPTURE listener that vetoes the click. */
function installGuard() {
  const onCapture = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  document.addEventListener('click', onCapture, true);
  return () => document.removeEventListener('click', onCapture, true);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('useUpDownNavigation — pointer + prev/next', () => {
  it('seeds the pointer from activeId and reports its neighbours', () => {
    const { nav, teardown } = renderNav({ activeId: 'b' });
    expect(nav().activeId).toBe('b');
    expect(nav().prevId).toBe('a');
    expect(nav().nextId).toBe('c');
    teardown();
  });

  it('reports null at the ends', () => {
    const { nav, teardown } = renderNav({ activeId: 'a' });
    expect(nav().prevId).toBeNull();
    expect(nav().nextId).toBe('b');
    teardown();
  });

  it('steps the optimistic pointer immediately, without committing', () => {
    const { nav, committed, teardown } = renderNav({ activeId: 'a' });
    act(() => press('ArrowDown'));
    expect(nav().activeId).toBe('b'); // moved now
    expect(committed).toEqual([]); // but nothing navigated yet
    teardown();
  });
});

describe('useUpDownNavigation — debounced commit', () => {
  it('a fast three-step run commits ONCE, to the LAST row', () => {
    const { nav, committed, teardown } = renderNav({ activeId: 'a', debounceMs: 300 });

    act(() => {
      press('ArrowDown');
      vi.advanceTimersByTime(30);
      press('ArrowDown');
      vi.advanceTimersByTime(30);
      press('ArrowDown');
    });
    expect(nav().activeId).toBe('d'); // skimmed to the 4th row
    expect(committed).toEqual([]); // not committed mid-run

    act(() => vi.advanceTimersByTime(300));
    expect(committed).toEqual(['/bills/d']); // exactly one commit, last row
    teardown();
  });

  it('a single step commits that one row after the debounce', () => {
    const { committed, teardown } = renderNav({ activeId: 'a', debounceMs: 300 });
    act(() => press('ArrowDown'));
    act(() => vi.advanceTimersByTime(300));
    expect(committed).toEqual(['/bills/b']);
    teardown();
  });

  it('does not commit when the pointer never left the active row', () => {
    const { committed, teardown } = renderNav({ activeId: 'a', debounceMs: 300 });
    act(() => press('ArrowUp')); // up from the first row is a no-op
    act(() => vi.advanceTimersByTime(300));
    expect(committed).toEqual([]);
    teardown();
  });

  it('defaults the debounce to 500ms', () => {
    const { committed, teardown } = renderNav({ activeId: 'a' });
    act(() => press('ArrowDown'));
    act(() => vi.advanceTimersByTime(499));
    expect(committed).toEqual([]); // still settling
    act(() => vi.advanceTimersByTime(1));
    expect(committed).toEqual(['/bills/b']); // fires at 500
    teardown();
  });
});

describe('useUpDownNavigation — veto', () => {
  it('does NOT navigate and snaps the pointer back when the guard vetoes', () => {
    const removeGuard = installGuard();
    const { nav, committed, teardown } = renderNav({ activeId: 'a', debounceMs: 300 });

    act(() => press('ArrowDown'));
    expect(nav().activeId).toBe('b'); // optimistic skim

    act(() => vi.advanceTimersByTime(300));
    expect(committed).toEqual([]); // guard stopPropagation'd the click — no hop
    expect(nav().activeId).toBe('a'); // …so snap the pill back to the page we're on

    removeGuard();
    teardown();
  });
});

describe('useUpDownNavigation — re-sync on landed navigation', () => {
  it('follows the activeId prop to the SAME row it names (not an end)', () => {
    const { nav, rerender, teardown } = renderNav({ activeId: 'a', debounceMs: 300 });
    act(() => press('ArrowDown')); // pointer optimistic at 'b'
    act(() => rerender({ activeId: 'b', debounceMs: 300 })); // route lands on 'b'
    expect(nav().activeId).toBe('b');
    expect(nav().prevId).toBe('a');
    expect(nav().nextId).toBe('c');
    teardown();
  });

  it('re-sync drops a pending commit (the landed hop IS its destination)', () => {
    const { committed, rerender, teardown } = renderNav({ activeId: 'a', debounceMs: 300 });
    act(() => press('ArrowDown')); // arms a commit toward 'b'
    act(() => rerender({ activeId: 'b', debounceMs: 300 })); // lands on 'b' first
    act(() => vi.advanceTimersByTime(300)); // the old timer must not re-fire
    expect(committed).toEqual([]); // no stale commit
    teardown();
  });

  it('a same-index / back-forward hop re-syncs cleanly', () => {
    const { nav, rerender, teardown } = renderNav({ activeId: 'c' });
    act(() => rerender({ activeId: 'a' }));
    expect(nav().activeId).toBe('a');
    expect(nav().prevId).toBeNull();
    expect(nav().nextId).toBe('b');
    teardown();
  });
});

describe('useUpDownNavigation — key gating', () => {
  it('ignores arrows while typing in a field', () => {
    const { nav, teardown } = renderNav({ activeId: 'a' });
    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => press('ArrowDown', input));
    expect(nav().activeId).toBe('a'); // untouched
    teardown();
  });

  it('does not bind while disabled', () => {
    const { nav, teardown } = renderNav({ activeId: 'a', enabled: false });
    act(() => press('ArrowDown'));
    expect(nav().activeId).toBe('a');
    teardown();
  });
});
