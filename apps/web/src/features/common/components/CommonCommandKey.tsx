'use client';

import { Kbd } from '@ramps/ui/Kbd';

import { useIsApplePlatform } from '../hooks/useIsApplePlatform';

/**
 * CommonCommandKey — the "command" modifier keycap, spelled for the current OS:
 * `⌘` on Apple keyboards, `Ctrl` everywhere else. It's the visible half of the
 * ⌘/Ctrl+K search shortcut (the behaviour lives in useCommandPlusKey).
 *
 * Hydration-safe: the OS read lives in {@link useIsApplePlatform} (shared with
 * the bill form's submit chips) — `Ctrl` on the first paint everywhere,
 * corrected to `⌘` after hydration on a Mac, with SSR and the first client
 * render always agreeing.
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
  const isApple = useIsApplePlatform();

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
