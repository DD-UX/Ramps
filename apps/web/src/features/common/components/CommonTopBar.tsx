import { Avatar } from '@ramps/ui/Avatar';
import { IconButton } from '@ramps/ui/IconButton';
import { Bell, Plus } from '@ramps/ui/icons';
import type { PropsWithChildren, ReactNode } from 'react';

/**
 * CommonTopBar — the app's persistent horizontal top bar, spanning the content
 * area to the right of the sidebar.
 *
 * Vetted against the home-dashboard frame
 * (docs/…/snapshots/01-home-dashboard-left-nav.jpeg): a white surface with a
 * bone bottom border, the general search filling the flexible middle, and a
 * right cluster of notifications (bell) + quick-add (plus) actions that sit
 * BEFORE the user avatar. Token-only styling.
 */
export interface CommonTopBarProps extends PropsWithChildren {
  /** Optional page title (left slot, before the search). */
  title?: ReactNode;
  className?: string;
}

export function CommonTopBar({ title, children, className }: CommonTopBarProps) {
  const baseClasses = 'flex items-center border-b border-bone bg-white px-rui-6 py-rui-3';
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <header className={finalClasses}>
      {/* Left: optional page title */}
      {title && <h1 className="font-heading text-ink mr-rui-4 text-lg">{title}</h1>}

      {/* Middle: the general search fills the flexible space. */}
      <div className="min-w-0 flex flex-1 items-center">{children}</div>

      {/* Right: quick actions (bell, plus) then the user — actions BEFORE user. */}
      <div className="gap-rui-2 ml-rui-4 flex items-center">
        <IconButton label="Notifications" variant="ghost" rounded icon={<Bell size={18} />} />
        <IconButton label="Create new" variant="ghost" rounded icon={<Plus size={18} />} />
        <Avatar name="Diego Diaz" size="sm" />
      </div>
    </header>
  );
}
