'use client';

import { Kbd } from '@ramps/ui/Kbd';
import { useSyncExternalStore } from 'react';

import { detectApplePlatform } from '../helpers/platform.helpers';

/**
 * Read "is this an Apple platform?" hydration-safely with useSyncExternalStore:
 * the client snapshot reads the real `navigator`, the server snapshot is always
 * `false` — so SSR and the first client render agree (no markup mismatch) and
 * React swaps to the true value after hydration. The platform never changes, so
 * `subscribe` never fires; it just returns a no-op unsubscribe.
 */
const subscribeToPlatform = () => () => {};

/**
 * CommonCommandKey — the "command" modifier keycap, spelled for the current OS:
 * `⌘` on Apple keyboards, `Ctrl` everywhere else. It's the visible half of the
 * ⌘/Ctrl+K search shortcut (the behaviour lives in useCommandPlusKey).
 *
 * Hydration-safe (via useSyncExternalStore below): the server has no
 * `navigator`, so we render the non-Apple `Ctrl` on the first paint and correct
 * to `⌘` after hydration if we're on a Mac. Both the server and the client's
 * first render agree (no markup mismatch); React then re-reads the client
 * snapshot.
 *
 * Renders inside the design system's `Kbd` keycap by default so it matches the
 * app's other shortcut chips; pass `asChild` to get the bare glyph text instead
 * (e.g. inline in a sentence).
 */
export interface CommonCommandKeyProps {
  /** Render the bare glyph text instead of wrapping it in a `Kbd` keycap. */
  asChild?: boolean;
  className?: string;
}

export function CommonCommandKey({ asChild = false, className }: CommonCommandKeyProps) {
  // Client snapshot: the real navigator. Server snapshot: always false — so the
  // first paint is `Ctrl` everywhere and React corrects to `⌘` post-hydration.
  const isApple = useSyncExternalStore(subscribeToPlatform, detectApplePlatform, () => false);

  const glyph = isApple ? '⌘' : 'Ctrl';
  // A screen reader hears "Command" / "Control" rather than the raw "⌘" glyph.
  const label = isApple ? 'Command' : 'Control';

  if (asChild) {
    return (
      <span className={className} aria-label={label}>
        {glyph}
      </span>
    );
  }

  return (
    <Kbd className={className} aria-label={label}>
      {glyph}
    </Kbd>
  );
}
