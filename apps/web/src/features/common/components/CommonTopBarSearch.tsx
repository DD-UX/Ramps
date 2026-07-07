'use client';

import { Input } from '@ramps/ui/Input';
import { Kbd } from '@ramps/ui/Kbd';
import { useCallback, useRef } from 'react';

import { useCommandPlusKey } from '../hooks/useCommandPlusKey';
import { CommonCommandKey } from './CommonCommandKey';

/**
 * CommonTopBarSearch — the app-wide search field in the top bar. It's a general
 * search affordance (not the bills-specific `?q=` toolbar): ⌘K / Ctrl+K from
 * anywhere focuses it.
 *
 * Vetted against the home-dashboard frame
 * (docs/…/snapshots/01-home-dashboard-left-nav.jpeg): a flat, borderless field
 * that stretches across the bar, with the ⌘/Ctrl + K keycaps leading on the
 * LEFT and "Search for anything" placeholder beside them — no magnifying glass.
 *
 * The shortcut is wired through `useCommandPlusKey('k', …)`, which owns the
 * document listener + AbortController; here we only `preventDefault()` (so ⌘K
 * doesn't hit the browser's own search) and focus the input. The keycap hint is
 * `CommonCommandKey` (the OS-correct modifier) beside a `K`.
 */
export interface CommonTopBarSearchProps {
  /** Placeholder copy; defaults to the generic product-wide prompt. */
  placeholder?: string;
  className?: string;
}

export function CommonTopBarSearch({
  placeholder = 'Search for anything',
  className,
}: CommonTopBarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusSearch = useCallback((event: KeyboardEvent) => {
    // Stop the browser's own ⌘K/Ctrl+K (address-bar search in some browsers).
    event.preventDefault();
    inputRef.current?.focus();
  }, []);

  useCommandPlusKey('k', focusSearch);

  return (
    <Input
      ref={inputRef}
      type="search"
      placeholder={placeholder}
      aria-label="Search"
      // Keycaps lead on the LEFT (⌘/Ctrl then K), matching the frame. Extra
      // gap keeps the placeholder off the second cap.
      leadingIcon={
        <span className="gap-rui-1 flex items-center" aria-hidden>
          <CommonCommandKey />
          <Kbd>K</Kbd>
        </span>
      }
      // Flat, borderless bar that fills the top-bar's flexible middle. Left
      // padding clears the two-chip lead; the search default border/ring is
      // dropped so the field reads as part of the bar, not a boxed control.
      className={'pl-20 w-full border-transparent bg-transparent focus:ring-0 ' + (className ?? '')}
    />
  );
}
