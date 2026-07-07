'use client';

import { Search } from '@ramps/ui/icons';
import { Input } from '@ramps/ui/Input';
import { Kbd } from '@ramps/ui/Kbd';
import { useCallback, useRef } from 'react';

import { useCommandPlusKey } from '../hooks/useCommandPlusKey';
import { CommonCommandKey } from './CommonCommandKey';

/**
 * CommonTopBarSearch — the app-wide search field in the top bar. It's a general
 * search affordance (not the bills-specific `?q=` toolbar): ⌘K / Ctrl+K from
 * anywhere focuses it, and the field advertises that chord with a ⌘/Ctrl + K
 * hint on its right.
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
  placeholder = 'Search…',
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
    <div className={className}>
      <Input
        ref={inputRef}
        rounded
        type="search"
        placeholder={placeholder}
        aria-label="Search"
        leadingIcon={<Search size={16} />}
        trailingIcon={
          <span className="gap-rui-1 flex items-center" aria-hidden>
            <CommonCommandKey />
            <Kbd>K</Kbd>
          </span>
        }
        // Room for the two-chip hint on the right (Input's default pr-8 fits one).
        className="w-64 pr-16"
      />
    </div>
  );
}
