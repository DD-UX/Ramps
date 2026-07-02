import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Button — the design system's primary action primitive.
 *
 * Tokens only: colors/radii come from `--rui-*` custom properties (see
 * tokens.css), never hardcoded. Variant styling resolves through a lookup map
 * rather than ternary chains. This is a seed implementation; the full Ramp
 * button (sizes, loading, icon slots) fills in during the design-system build.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_STYLE: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--rui-accent)] text-[var(--rui-ink)]',
  secondary: 'bg-[var(--rui-limestone)] text-[var(--rui-ink)]',
  destructive: 'bg-[var(--rui-destructive)] text-[var(--rui-limestone)]',
};

export function Button({ variant = 'primary', className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={clsx(
        'inline-flex items-center justify-center rounded-[var(--rui-radius-control)] px-[var(--rui-space-4)] py-[var(--rui-space-2)] font-[number:var(--rui-font-weight-heading)]',
        VARIANT_STYLE[variant],
        className,
      )}
      {...props}
    />
  );
}
