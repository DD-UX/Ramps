import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Button — the design system's primary action primitive.
 *
 * Tokens only: colors/radii resolve through the Tailwind theme bridge
 * (theme.css maps `--rui-*` → semantic utilities like `bg-accent`,
 * `rounded-control`), never hardcoded hex/size values. Variant styling
 * resolves through a lookup map rather than ternary chains. This is a seed
 * implementation; the full Ramp button (sizes, loading, icon slots) fills in
 * during the design-system build.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_STYLE: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-ink',
  secondary: 'bg-limestone text-ink',
  destructive: 'bg-destructive text-limestone',
};

export function Button({ variant = 'primary', className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={clsx(
        'inline-flex items-center justify-center rounded-control px-rui-4 py-rui-2 font-heading',
        VARIANT_STYLE[variant],
        className,
      )}
      {...props}
    />
  );
}
