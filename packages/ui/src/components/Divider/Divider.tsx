import { cn } from '../../lib/cn';

/**
 * Divider — a hairline separator on the bone token.
 *
 * Separates form sections in the bill-detail drawer and entries in overflow
 * menus. Horizontal by default; `vertical` for inline toolbars. Decorative, so
 * it's aria-hidden with the correct separator semantics only when meaningful.
 */
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'bg-bone',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}
