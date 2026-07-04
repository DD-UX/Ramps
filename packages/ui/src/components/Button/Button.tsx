import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Spinner } from '../Spinner/Spinner';

/**
 * Button — the design system's action primitive.
 *
 * Tokens only: colours/radii resolve through the Tailwind theme bridge
 * (theme.css maps `--rui-*` → semantic utilities like `bg-accent`,
 * `rounded-control`), never hardcoded hex/size values. Variant + size resolve
 * through lookup maps, never ternary chains.
 *
 * Reworked against the AP-agent frames:
 *  - snapshot 6 — "New bill" primary (lime/ink) with a trailing chevron; the
 *    row "Approve" buttons are the white + bone-border `secondary`; "Options ▾"
 *    is `subtle`.
 *  - snapshot 9 — the submit CTA "Create bill" is the dark `ink` fill with a
 *    trailing ⌘↵ keyboard chip; "Save draft" is `subtle` with a leading Lucide
 *    save icon.
 *
 * Every variant carries a *real* disabled affordance (dimmed + not-allowed) —
 * a disabled button must never be pixel-identical to its enabled base.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ink' | 'destructive';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered before the label (e.g. a Lucide `<Save />`). */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label (e.g. a chevron on a dropdown trigger). */
  trailingIcon?: ReactNode;
  /**
   * Keyboard shortcut chip rendered at the trailing edge (e.g. `'⌘↵'` on the
   * primary submit). Purely decorative — wire the real shortcut separately.
   */
  keyChip?: ReactNode;
  /** Swaps the leading icon for a spinner and disables the button. */
  loading?: boolean;
}

/**
 * Rest / hover / focus-visible per variant. Focus ring is the accent lime via
 * the control-ring token, offset so it reads on any surface. `secondary` is the
 * white + bone-border outline; `subtle` is transparent with a limestone hover;
 * `ink` is the dark submit fill.
 */
const VARIANT_STYLE: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent/90 focus-visible:ring-control-ring',
  secondary:
    'bg-white text-ink border border-bone hover:bg-limestone focus-visible:ring-control-ring',
  subtle: 'bg-transparent text-ink hover:bg-limestone focus-visible:ring-control-ring',
  ink: 'bg-ink text-white hover:bg-ink-strong focus-visible:ring-control-ring',
  destructive:
    'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-control-ring',
};

/** Height / padding / text scale. Both sizes stay near-square (control radius). */
const SIZE_STYLE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-rui-2 text-sm',
  md: 'h-10 gap-2 px-rui-3 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  keyChip,
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
        // Layout + shape: control radius (4px), heading weight, inline icon rows.
        'inline-flex items-center justify-center rounded-control font-heading whitespace-nowrap',
        'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
        // The real disabled affordance — dimmed + not-allowed, never the base.
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZE_STYLE[size],
        VARIANT_STYLE[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leadingIcon}
      {children}
      {trailingIcon}
      {keyChip ? (
        <kbd className="ml-1 inline-flex items-center rounded-control bg-black/10 px-1.5 py-0.5 font-sans text-xs text-current/80">
          {keyChip}
        </kbd>
      ) : null}
    </button>
  );
}
