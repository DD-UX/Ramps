'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * useUpDownNavigation — debounced ↑/↓ movement through an ordered list of
 * links, where a fast run of presses SKIMS the optimistic pointer instantly
 * but COMMITS only one navigation once the keys settle.
 *
 * The list rows are `{ id, href }`; the caller owns the markup (a rail, a side
 * menu) and just reflects `activeId` — the OPTIMISTIC pointer. ↑/↓ move it one
 * row at a time and (re)arm a `debounceMs` timer; when it fires, the hook
 * commits to whatever row the pointer landed on.
 *
 * COMMIT = CLICK THE REAL ROW ANCHOR. The caller already renders each row as a
 * real link; on commit the hook asks the caller for that row's anchor
 * ({@link UseUpDownNavigationOptions.resolveAnchor}) and clicks it. That one
 * click is the whole hop:
 *  - the framework owns the anchor, so it's a SOFT navigation (no full reload);
 *  - a document-level nav GUARD (e.g. an unsaved-changes interceptor that
 *    watches anchor clicks in the capture phase) sees it and can veto a
 *    dirty-form hop — for free, with no probe and no propagation reading.
 *
 * On a clean commit the pointer is left where it skimmed — the caller's next
 * `activeId` re-syncs it there. If the guard vetoes (its capture listener
 * `stopPropagation`s the click, so it never reaches `document`), the hook snaps
 * the pointer straight back to the page we're still on — the URL never changed,
 * so nothing else would.
 *
 * Keyboard is bound at `document`, so the arrows work without focusing the
 * list — but only when `enabled`, and never while the user is typing in a
 * field or a dialog is open (those own their arrows).
 *
 * PURE + REUSABLE: no context, no motion, no router import — the caller injects
 * `resolveAnchor`, so the bill rail and the app side menu both drive it the
 * same way.
 */
export interface UpDownNavigationItem {
  /** Stable row identity — matches `activeId`. */
  id: string;
  /** Where selecting this row navigates. */
  href: string;
}

export interface UseUpDownNavigationOptions {
  /** The rows in visual order — the list ↑/↓ walk. */
  items: readonly UpDownNavigationItem[];
  /** The committed active id — the page's own server truth. Re-syncs the pointer. */
  activeId: string;
  /**
   * Return the REAL rendered anchor for a row id (the caller's own `<Link>`),
   * or null if it isn't in the DOM. The hook clicks it to commit — so the click
   * flows through the framework's soft-nav AND any document nav guard, exactly
   * like a mouse click on that row.
   */
  resolveAnchor: (id: string) => HTMLAnchorElement | null;
  /** How long a run of presses settles before committing. Default 500ms. */
  debounceMs?: number;
  /** Bind the arrow keys only while truthy. Default true. */
  enabled?: boolean;
}

export interface UpDownNavigation {
  /** The OPTIMISTIC pointer — which row to highlight right now. */
  activeId: string;
  /** The id one row up / down from the pointer, or null at an end. */
  prevId: string | null;
  /** @see prevId */
  nextId: string | null;
  /** Move the pointer one row (down `+1` / up `-1`) and (re)arm the commit. */
  stepActive: (delta: 1 | -1) => void;
  /** Point at a row NOW and drop any pending skim — for direct clicks. */
  setActiveId: (id: string) => void;
}

/** True when a key belongs to something else: a field, or an open dialog. */
function isTypingOrDialog(target: EventTarget | null): boolean {
  if (target instanceof HTMLElement) {
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return true;
  }
  return document.querySelector('[role="dialog"]') !== null;
}

export function useUpDownNavigation({
  items,
  activeId,
  resolveAnchor,
  debounceMs = 500,
  enabled = true,
}: UseUpDownNavigationOptions): UpDownNavigation {
  const [pointerId, setPointerId] = useState(activeId);

  // The live cursor for event handlers + the timer: state batches, but several
  // presses in one tick must each step from the last, and the timer (armed
  // presses ago) must commit the row the LAST press landed on.
  const pointerRef = useRef(pointerId);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Everything the (long-lived) commit timer needs, mirrored into refs so
  // `commit` can be created ONCE and never go stale. This is load-bearing: if
  // `commit` re-created when `activeId`/`resolveAnchor` changed, so would
  // `stepActive`, and a re-render mid-hop could clear-then-lose the armed timer
  // — the intermittent "pill moved but never navigated" bug.
  const resolveAnchorRef = useRef(resolveAnchor);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    resolveAnchorRef.current = resolveAnchor;
    activeIdRef.current = activeId;
  });

  const orderedIds = useMemo(() => items.map((item) => item.id), [items]);

  const clearCommit = useCallback(() => {
    if (commitTimer.current !== null) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
  }, []);

  // Commit the skim by CLICKING the row's real anchor. One click = the soft
  // navigation AND the guard's chance to veto (its capture listener sees the
  // anchor click). Nothing to defer, no probe, no manual push. STABLE identity
  // (`[]` deps, all state read from refs) so the armed timer can never be
  // orphaned by a re-render.
  //
  // We DO watch whether the click reached `document`: a nav guard vetoes by
  // `stopPropagation`ing it in the capture phase, so a swallowed click means
  // "stay". On a veto the URL never changes, so `activeId` won't re-sync the
  // pill on its own — snap the optimistic pointer back to the page we're still
  // on. (A clean click bubbles to document; the framework's own soft-nav then
  // lands a new `activeId` that re-syncs us there.)
  const commit = useCallback(() => {
    commitTimer.current = null;
    const activeIdNow = activeIdRef.current;
    const targetId = pointerRef.current;
    if (targetId === activeIdNow) return; // pointer never left the current page

    const anchor = resolveAnchorRef.current(targetId);
    if (!anchor) return;

    let reachedDocument = false;
    const onBubble = () => {
      reachedDocument = true;
    };
    document.addEventListener('click', onBubble, { once: true });
    anchor.click();
    document.removeEventListener('click', onBubble);

    if (!reachedDocument) {
      // Guard vetoed (dirty form): its modal owns the destination — snap back.
      setPointerId(activeIdNow);
      pointerRef.current = activeIdNow;
    }
  }, []);

  // Direct pick (a click on a row): move now, drop any queued skim — the click
  // is its own navigation. Ref write happens in an event handler, not render.
  const setActiveId = useCallback(
    (id: string) => {
      clearCommit();
      pointerRef.current = id;
      setPointerId(id);
    },
    [clearCommit],
  );

  // One ↑/↓ step: move the pointer now, re-arm the commit deadline.
  const stepActive = useCallback(
    (delta: 1 | -1) => {
      const index = orderedIds.indexOf(pointerRef.current);
      if (index === -1) return;
      const nextId = orderedIds[index + delta];
      if (nextId === undefined) return; // at an end
      pointerRef.current = nextId;
      setPointerId(nextId);
      clearCommit();
      commitTimer.current = setTimeout(commit, debounceMs);
    },
    [orderedIds, clearCommit, commit, debounceMs],
  );

  // Re-sync the pointer whenever the committed `activeId` changes — a landed
  // navigation (a skim's destination, a same-index/back-forward hop, or the
  // page we stayed on after a veto). React's "derive state from props": adjust
  // the STATE during render (no extra paint of the stale highlight, no illegal
  // setState-in-effect); the ref write + timer clear — both illegal mid-render
  // — settle in the effect just below.
  const [syncedActiveId, setSyncedActiveId] = useState(activeId);
  if (syncedActiveId !== activeId) {
    setSyncedActiveId(activeId);
    setPointerId(activeId);
  }

  useEffect(() => {
    pointerRef.current = activeId;
    clearCommit();
  }, [activeId, clearCommit]);

  // Never let a queued commit outlive the list.
  useEffect(() => clearCommit, [clearCommit]);

  // Arrow keys, document-wide, gated by `enabled` and field/dialog focus.
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (isTypingOrDialog(event.target)) return;
      event.preventDefault();
      stepActive(event.key === 'ArrowDown' ? 1 : -1);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, stepActive]);

  const index = orderedIds.indexOf(pointerId);
  const prevId = index > 0 ? (orderedIds[index - 1] ?? null) : null;
  const nextId =
    index !== -1 && index < orderedIds.length - 1 ? (orderedIds[index + 1] ?? null) : null;

  return { activeId: pointerId, prevId, nextId, stepActive, setActiveId };
}
