import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/**
 * SideMenu — the product's left navigation (the persistent vertical sidebar).
 *
 * VETTING EVIDENCE (all frames show the nav on the left edge):
 *  - Primary reference: …/does-ramp-live-up-to-the-hype…/01-home-dashboard-left-nav.jpeg
 *    (full-height view with workspace header, items, divider, Ask Ramp at bottom).
 *  - Product overview: 01-dashboard-drafts-tab.jpeg, 02-fraud-duplicate-warnings.jpeg,
 *    16-for-payment-tab.jpeg (all show the same nav structure: Bill Pay active).
 *  - AP agent: 1.jpeg (nav with Home + badge, Bill Pay active, Accounting/Vendors with badges).
 *
 * COLOR VETTING (1px sampling, ffmpeg-based):
 *  - Nav background (product-overview/02 x40-60 y100-180): #f0efeb–#f1f0ec → LIMESTONE
 *    (--rui-limestone #f4f2f0, consensus across all frames).
 *  - Active item background (Bill Pay, product-overview/02 x80-100 y230): #e5e0dc → STONE
 *    (--rui-stone #e3e0dd, visibly darker inset against limestone).
 *  - Active item text (product-overview/02 x45-50 y230): #0b0704–#2c2825 → INK
 *    (--rui-ink #1a1919, dark and strong).
 *  - Inactive item text (product-overview/02 x45-50 y137/169): #6f6e6a → HUSHED
 *    (--rui-hushed #6e6a68, mid-gray, exact token match).
 *  - Badge background (product-overview/02 x160-165 y65/302): #fbff85–#f8ff77 → ACCENT
 *    (--rui-accent #e4f222, the lime; samples are JPEG-inflated but the yellow-green family
 *    is unmistakable and matches no other token).
 *  - Badge text: ink (same INK as active text, high contrast on lime).
 *  - Corners: VETTED at 5x zoom across all frames — every nav item, badge, and the nav
 *    container itself is sharp 0px (rounded-square). No pill radii anywhere in the nav.
 *
 * INFERRED (not directly visible in static frames):
 *  - Hover state: limestone background (consistent with Button/Menu hover treatments and
 *    the product's restrained hover palette — the frames show no hover, so we use the
 *    existing system convention: inactive → hover:bg-limestone, active stays stone).
 *  - Focus rings: control-ring (accent lime, 2px offset) per the form control standard.
 *  - Divider: bone hairline (--rui-bone, the standard neutral divider token) — the frames
 *    show a faint hairline between Treasury and Accounting, visibly lighter than stone.
 *
 * STRUCTURE (observed in frames):
 *  - Workspace header at top (Clara Media LLC dropdown in does-ramp/01, ActionInc123 in
 *    product-overview/03) — NOT implemented here (out of scope; that's a separate HeaderNav
 *    or WorkspacePicker component the app composes above SideMenu).
 *  - Stacked menu items (Home, Insights, Manage spend, …, Bill Pay, …, Accounting, Vendors,
 *    Policy, Company) — some with trailing badges (Home: 90, Accounting: 383, Vendors: 3).
 *  - One divider visible between sections (Treasury ↔ Accounting in most frames).
 *  - Ask Ramp button at bottom (does-ramp/01 x50-70 y610 samples the canvas/limestone
 *    boundary) — also out of scope for this primitive; the app footer composes it.
 *
 * COMPONENT CONTRACT:
 *  - Compound: SideMenu (container), SideMenuItem (interactive link/button), SideMenuDivider.
 *  - Active state via `active` boolean (controls stone background + ink text).
 *  - Badge count via `badge` number (renders accent pill if present).
 *  - Leading icon support (all items have an icon: home/graph/wallet/plane/receipt/etc.).
 *  - Semantic nav: wraps items in <nav><ul> with proper ARIA roles and current-page marking.
 */

export interface SideMenuProps {
  children: ReactNode;
  className?: string;
  /** Accessible label for the nav landmark (e.g. "Main navigation"). */
  'aria-label'?: string;
}

export interface SideMenuItemProps {
  /** The item label (e.g. "Bill Pay"). */
  children: ReactNode;
  /** Leading icon (Lucide icon or SVG, e.g. <Receipt />). */
  icon?: ReactNode;
  /** Badge count (e.g. 90, 383) — renders an accent pill at the trailing edge if present. */
  badge?: number;
  /** Active state — highlights the item with stone background and ink text. */
  active?: boolean;
  /** Click handler for navigation (wire your router here). */
  onClick?: () => void;
  /** Href for native anchor behavior (alternative to onClick for link-based routing). */
  href?: string;
  className?: string;
}

export interface SideMenuDividerProps {
  className?: string;
}

/**
 * SideMenu container — the full-height nav sidebar.
 * Renders a <nav> with limestone background and houses the item list.
 */
export function SideMenu({ children, className, 'aria-label': ariaLabel }: SideMenuProps) {
  return (
    <nav
      aria-label={ariaLabel ?? 'Main navigation'}
      className={clsx(
        'flex h-full w-48 flex-col bg-limestone',
        // Sharp 0px corners (vetted across all frames).
        'rounded-square',
        className,
      )}
    >
      <ul className="flex flex-col gap-0.5 p-rui-2">{children}</ul>
    </nav>
  );
}

/**
 * SideMenuItem — an individual nav item (Home, Bill Pay, Accounting, etc.).
 * Renders as a <button> (onClick) or <a> (href) with optional icon, label, and badge.
 * Active items get a stone background and ink text; inactive items are hushed with
 * limestone hover.
 */
export function SideMenuItem({
  children,
  icon,
  badge,
  active = false,
  onClick,
  href,
  className,
}: SideMenuItemProps) {
  const Component = href ? 'a' : 'button';

  const content = (
    <>
      {icon && (
        <span className="flex-shrink-0 text-current" aria-hidden>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate text-left text-sm font-body">{children}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="flex-shrink-0 rounded-square bg-accent px-1.5 py-0.5 text-xs font-body text-ink"
          aria-label={`${badge} items`}
        >
          {badge}
        </span>
      )}
    </>
  );

  return (
    <li>
      <Component
        onClick={onClick}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'flex w-full items-center gap-rui-2 rounded-square px-rui-3 py-rui-2',
          'transition-colors outline-none',
          // Active: stone background (vetted #e5e0dc) + ink text (vetted #0b0704–#2c2825).
          // Inactive: transparent + hushed text (vetted #6f6e6a).
          active
            ? 'bg-stone text-ink hover:bg-stone'
            : 'bg-transparent text-hushed hover:bg-limestone hover:text-ink',
          // Focus ring: accent lime, 2px offset (control-ring standard).
          'focus-visible:ring-2 focus-visible:ring-control-ring focus-visible:ring-offset-2',
          // Pointer affordance.
          'cursor-pointer',
          className,
        )}
      >
        {content}
      </Component>
    </li>
  );
}

/**
 * SideMenuDivider — a bone hairline between nav sections (e.g. Treasury ↔ Accounting).
 * INFERRED: the frames show a faint divider; bone is the standard neutral hairline token.
 */
export function SideMenuDivider({ className }: SideMenuDividerProps) {
  return (
    <li role="separator" aria-hidden className={clsx('my-rui-2', className)}>
      <hr className="border-t border-bone" />
    </li>
  );
}
