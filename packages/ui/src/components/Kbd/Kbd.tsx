import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

/**
 * Kbd — the keyboard-key chip.
 *
 * Vetted against snapshot 9 (…/ramp-bill-pay-series-ap-agent/snapshots/9.jpeg)
 * at 6x zoom: the "Create bill" submit carries TWO separate chips — ⌘ then ↵ —
 * each a tiny white square sitting proud of the lime fill with a subtle keycap
 * shadow (no visible border line, just the raised edge) and a dark glyph.
 * Sharp corners, like every rectangle in the system.
 *
 * One chip per key: compose combos by rendering several `<Kbd>`s side by side
 * (the frame shows discrete keycaps, never one "⌘↵" slab). Tokens only —
 * the lift is the dedicated `--rui-shadow-key` keycap shadow.
 */
export type KbdProps = HTMLAttributes<HTMLElement>;

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={clsx(
        // A raised white square keycap: hairline + 1px drop via shadow-key.
        'h-5 min-w-5 rounded-square bg-white px-1 inline-flex items-center justify-center',
        'font-sans text-xs font-body text-ink shadow-key leading-none select-none',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
