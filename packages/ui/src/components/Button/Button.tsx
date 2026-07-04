import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Kbd } from '../Kbd/Kbd';
import { Spinner } from '../Spinner/Spinner';

/**
 * Button — the design system's action primitive.
 *
 * Tokens only: colours/radii resolve through the Tailwind theme bridge
 * (theme.css maps `--rui-*` → semantic utilities like `bg-accent`,
 * `rounded-square`), never hardcoded hex/size values. Variant + size resolve
 * through lookup maps, never ternary chains.
 *
 * Reworked against the AP-agent frames:
 *  - snapshot 6 — "New bill" primary (lime/ink) with a trailing chevron; the
 *    row "Approve" buttons are the white + bone-border `secondary`; "Options ▾"
 *    is `subtle`.
 *  - snapshot 9 at 6x zoom — the submit CTA "Create bill" is the LIME
 *    `primary` carrying two separate ⌘ ↵ keycap chips (`keys`), and
 *    "Save draft" is the bare `underline` link action: floppy-disk icon +
 *    underlined ink label, no fill, no border.
 *
 * Every variant carries a *real* interactive affordance: pointer cursor when
 * enabled, dimmed + not-allowed when disabled — a disabled button must never
 * be pixel-identical to its enabled base.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'subtle'
  | 'ink'
  | 'underline'
  | 'destructive';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered before the label (e.g. a Lucide `<Save />`). */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label (e.g. a chevron on a dropdown trigger). */
  trailingIcon?: ReactNode;
  /**
   * Keyboard shortcut rendered as one raised `Kbd` chip PER key at the
   * trailing edge (snapshot 9: `['⌘', '↵']` on "Create bill"). Purely
   * decorative — wire the real shortcut separately.
   */
  keys?: string[];
  /** Swaps the leading icon for a spinner and disables the button. */
  loading?: boolean;
}

/**
 * Rest / hover / focus-visible per variant. Focus ring is the accent lime via
 * the control-ring token, offset so it reads on any surface. `secondary` is the
 * white + bone-border outline; `subtle` is transparent with a limestone hover;
 * `ink` is the dark fill; `underline` is the bare underlined link action
 * ("Save draft", snapshot 9 — icon + underlined ink label, no fill).
 */
const VARIANT_STYLE: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent/90 focus-visible:ring-control-ring',
  secondary:
    'bg-white text-ink border border-bone hover:bg-limestone focus-visible:ring-control-ring',
  subtle: 'bg-transparent text-ink hover:bg-limestone focus-visible:ring-control-ring',
  ink: 'bg-ink text-white hover:bg-ink-strong focus-visible:ring-control-ring',
  underline:
    'bg-transparent text-ink underline decoration-1 underline-offset-2 hover:text-ink-strong focus-visible:ring-control-ring',
  destructive:
    'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-control-ring',
};

/** Height / padding / text scale. Both sizes are sharp-cornered (square radius). */
const SIZE_STYLE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-rui-2 text-sm',
  md: 'h-10 gap-2 px-rui-3 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  keys,
  loading = false,
  disabled,
  className,
  type,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={clsx(
        // Layout + shape: square corners (0px, per the frames), heading weight, inline icon rows.
        'inline-flex items-center justify-center rounded-square font-heading whitespace-nowrap',
        'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
        // Real interactive affordances: pointer when enabled, dimmed +
        // not-allowed when disabled — never pixel-identical to the base.
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        SIZE_STYLE[size],
        VARIANT_STYLE[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leadingIcon}
      {children}
      {trailingIcon}
      {keys && keys.length > 0 ? (
        // One raised keycap per key (frame 9 shows discrete ⌘ and ↵ chips) —
        // the row rhythm is the button's own gap, chips sit gap-1 apart.
        <span className="inline-flex items-center gap-1" aria-hidden>
          {keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </span>
      ) : null}
    </button>
  );
}
