import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { IconButton } from '../IconButton/IconButton';

/**
 * Menu — the overflow / action menu that hangs off the three-dot IconButton in
 * every Bill Pay table row and card header (Edit · Duplicate · Delete, "Pay now",
 * "Mark as paid", "Remove") — see the row overflow in
 * …/snapshots/18-overview-grouped-by-status.jpeg.
 *
 * Kept self-contained and dependency-free: a controlled/uncontrolled popover that
 * closes on outside-click and Escape, renders a list of MenuItems, and routes
 * `tone="destructive"` items to the destructive token (Delete/Remove in red).
 * Tokens only.
 */
const DotsIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <circle cx="8" cy="3" r="1.4" />
    <circle cx="8" cy="8" r="1.4" />
    <circle cx="8" cy="13" r="1.4" />
  </svg>
);

export type MenuItemTone = 'default' | 'destructive';
export type MenuAlign = 'start' | 'end';

export interface MenuItem {
  label: ReactNode;
  onSelect?: () => void;
  tone?: MenuItemTone;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  /** Accessible name for the default overflow trigger. */
  label?: string;
  /** Override the trigger entirely (still gets the click handler wired). */
  trigger?: ReactNode;
  /**
   * Pill-shaped default trigger — forwarded to the built-in overflow
   * IconButton (same contract as Button/IconButton `rounded`). Ignored when a
   * custom `trigger` is supplied; shape that trigger yourself.
   */
  rounded?: boolean;
  align?: MenuAlign;
  className?: string;
}

const ITEM_TONE: Record<MenuItemTone, string> = {
  default: 'text-ink hover:bg-limestone',
  destructive: 'text-destructive hover:bg-tone-critical-surface',
};

export function Menu({
  items,
  label = 'More actions',
  trigger,
  rounded = false,
  align = 'end',
  className,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={clsx('relative inline-flex', className)}>
      {trigger ? (
        <span
          role="button"
          tabIndex={0}
          className="cursor-pointer"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen((v) => !v);
            }
          }}
        >
          {trigger}
        </span>
      ) : (
        <IconButton
          label={label}
          icon={DotsIcon}
          rounded={rounded}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
        />
      )}

      {open && (
        <div
          id={menuId}
          role="menu"
          className={clsx(
            'absolute top-full z-20 mt-rui-1 min-w-44 overflow-hidden rounded-square border border-bone bg-white py-rui-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onSelect?.();
              }}
              className={clsx(
                'flex w-full cursor-pointer items-center gap-rui-2 px-rui-3 py-rui-2 text-left text-sm font-body transition-colors',
                'focus:outline-none focus:bg-limestone disabled:opacity-40 disabled:pointer-events-none',
                ITEM_TONE[item.tone ?? 'default'],
              )}
            >
              {item.icon && <span aria-hidden>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
