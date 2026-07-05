import { Avatar } from '@ramps/ui/Avatar';
import type { PropsWithChildren, ReactNode } from 'react';

/**
 * CommonTopBar — the app's persistent horizontal top bar, spanning the content area
 * to the right of the sidebar.
 *
 * Layout: limestone/white surface with a bone bottom border, fixed padding,
 * flexible title slot on the left and user affordance (avatar) on the right.
 * Token-only styling.
 */
export interface CommonTopBarProps extends PropsWithChildren {
  /** Optional page title (left slot). */
  title?: ReactNode;
  className?: string;
}

export function CommonTopBar({ title, children, className }: CommonTopBarProps) {
  const baseClasses =
    'flex items-center justify-between border-b border-bone bg-white px-rui-6 py-rui-3';
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <header className={finalClasses}>
      {/* Left: page title */}
      {title && <h1 className="font-heading text-ink text-lg">{title}</h1>}
      {/* Right: user affordance and optional children */}
      <div className="gap-rui-3 ml-auto flex items-center">
        {children}
        <Avatar name="Diego Diaz" size="sm" />
      </div>
    </header>
  );
}
