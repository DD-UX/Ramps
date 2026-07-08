'use client';

import { cn } from '@ramps/ui/cn';
import { Kbd } from '@ramps/ui/Kbd';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { useRailActive } from '../context/RailActive.context';

/**
 * The rail's Prev / Next footer (frame 1's bottom-left corner) — step to the
 * card above/below the active bill in the rail's visual order.
 *
 * The shortcuts are the ARROWS — ↑ for Prev, ↓ for Next — because the rail
 * reads top-to-bottom: the key's direction is the hop's direction. Both steps
 * are real `<a href>` LINKS, not `router.push` calls, and the shortcuts fire
 * them by CLICKING the anchor (`ref.click()`) rather than routing directly:
 * a synthetic anchor click walks the same document-capture path as a pointer
 * click, so the unsaved-changes guard can veto a keyboard hop exactly like a
 * clicked one. Keys are ignored while the user is typing in a field or a
 * dialog is open (fields and dropdowns own their arrows). An end of the list
 * renders the label disabled (frame 1's muted "Prev") instead of dropping it.
 */
export interface BillDetailsRailNavProps {
  /** The previous card's bill id, or null at the top of the list. */
  prevId: string | null;
  /** The next card's bill id, or null at the bottom. */
  nextId: string | null;
}

/** True when the key belongs to something else: a field, or an open dialog. */
function isCapturedElsewhere(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return true;
  return document.querySelector('[role="dialog"]') !== null;
}

export function BillDetailsRailNav({ prevId, nextId }: BillDetailsRailNavProps) {
  const prevRef = useRef<HTMLAnchorElement>(null);
  const nextRef = useRef<HTMLAnchorElement>(null);
  const { setActiveId } = useRailActive();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (isCapturedElsewhere(event.target)) return;
      const anchor = event.key === 'ArrowDown' ? nextRef.current : prevRef.current;
      if (!anchor) return;
      event.preventDefault();
      anchor.click(); // through the guard's capture listener, like any click
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const step = (label: string, id: string | null, key: string, ref: typeof prevRef) =>
    id ? (
      <Link
        ref={ref}
        href={`/bills/${id}`}
        // Report the hop to the rail's optimistic active state, so the
        // floating pill glides to the target card before the route lands.
        // A guard-vetoed click never reaches here — the pill stays put.
        onClick={() => setActiveId(id)}
        className={cn('gap-rui-2 text-ink text-sm flex items-center', 'hover:underline')}
      >
        {label}
        <Kbd>{key}</Kbd>
      </Link>
    ) : (
      <span className="text-hushed text-sm" aria-disabled="true">
        {label}
      </span>
    );

  return (
    // h-14 matches the form footer's band across the border, one shared floor line.
    <div className="border-bone px-rui-4 h-14 flex shrink-0 items-center justify-between border-t">
      {step('Prev', prevId, '↑', prevRef)}
      {step('Next', nextId, '↓', nextRef)}
    </div>
  );
}
