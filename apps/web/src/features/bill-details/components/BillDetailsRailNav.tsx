'use client';

import { cn } from '@ramps/ui/cn';
import { Kbd } from '@ramps/ui/Kbd';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

/**
 * The rail's Prev / Next footer (frame 1's bottom-left corner) — step to the
 * card above/below the active bill in the rail's visual order.
 *
 * Both steps are real `<a href>` LINKS, not `router.push` calls, and the J/K
 * shortcuts fire them by CLICKING the anchor (`ref.click()`) rather than
 * routing directly: a synthetic anchor click walks the same document-capture
 * path as a pointer click, so the unsaved-changes guard can veto a keyboard
 * hop exactly like a clicked one. Keys are ignored while the user is typing
 * in a field or a dialog is open. An end of the list renders the label
 * disabled (frame 1's muted "Prev") instead of dropping it.
 */
export interface BillDetailsRailNavProps {
  /** The previous card's href, or null at the top of the list. */
  prevHref: string | null;
  /** The next card's href, or null at the bottom. */
  nextHref: string | null;
}

/** True when the key belongs to something else: a field, or an open dialog. */
function isCapturedElsewhere(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return true;
  return document.querySelector('[role="dialog"]') !== null;
}

export function BillDetailsRailNav({ prevHref, nextHref }: BillDetailsRailNavProps) {
  const prevRef = useRef<HTMLAnchorElement>(null);
  const nextRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== 'j' && event.key !== 'k') return;
      if (isCapturedElsewhere(event.target)) return;
      const anchor = event.key === 'j' ? nextRef.current : prevRef.current;
      if (!anchor) return;
      event.preventDefault();
      anchor.click(); // through the guard's capture listener, like any click
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const step = (label: string, href: string | null, key: string, ref: typeof prevRef) =>
    href ? (
      <Link
        ref={ref}
        href={href}
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
      {step('Prev', prevHref, 'K', prevRef)}
      {step('Next', nextHref, 'J', nextRef)}
    </div>
  );
}
