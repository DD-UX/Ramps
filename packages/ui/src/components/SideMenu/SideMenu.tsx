import { ChevronDown } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { Badge } from '../Badge/Badge';

const ACTIVE_ITEM_CLASS = 'bg-stone text-ink hover:bg-stone';

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
 *  - Corners: VETTED at 5x zoom across all frames — nav items and the nav container
 *    are sharp 0px (rounded-square). Badges are the exception BY DESIGN DECISION:
 *    they render as fully-rounded pills to match the count badges in the Tabs bar
 *    (user direction supersedes the frame reading here).
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
 *  - Brand mark at top (product-overview/01: the Ramp swoosh at the nav's top-left,
 *    x14-28 y12-26, ink strokes on the limestone nav) — the `header` slot; the app
 *    passes the Logo primitive (or a workspace picker) here.
 *  - Stacked menu items (Home, Insights, Manage spend, …, Bill Pay, …, Accounting, Vendors,
 *    Policy, Company) — some with trailing badges (Home: 90, Accounting: 383, Vendors: 3).
 *  - One divider visible between sections (Treasury ↔ Accounting in most frames).
 *  - Ask Ramp pinned at the very bottom (product-overview/01 x14-80 y604-614: a spark
 *    glyph + "Ask Ramp") — the `footer` slot, composed with SideMenuAction. This
 *    system reshapes the band as "About DD" linking to https://www.diegodiaz.dev/.
 *
 * FOOTER COLOR VETTING (product-overview/01, 1px sampling):
 *  - "Ask Ramp" text: densest glyph junctions #4f4e4a–#575652 — DARKER than hushed
 *    (#6e6a68), so the label is INK (thin small text JPEG-lightens dark strokes).
 *  - Spark glyph: #7a7975–#8b8784 — the HUSHED family (thin strokes read light).
 *  - Nav bg at footer level: #f0efeb–#f1f0ec — the same limestone, no separate band.
 *
 * COMPONENT CONTRACT:
 *  - Compound: SideMenu (container with `header`/`footer` slots), SideMenuItem
 *    (interactive link/button), SideMenuDivider, SideMenuAction (footer button).
 *  - Active state via `active` boolean (controls stone background + ink text).
 *  - Badge count via `badge` number (renders accent pill if present).
 *  - Leading icon support (all items have an icon: home/graph/wallet/plane/receipt/etc.).
 *  - Semantic nav: wraps items in <nav><ul> with proper ARIA roles and current-page
 *    marking; header/footer render OUTSIDE the <ul> so list semantics stay clean.
 */

export interface SideMenuProps extends PropsWithChildren {
  /**
   * Top slot — the brand area above the item list (the product shows the Ramp
   * mark here; pass the Logo primitive). Renders outside the <ul>.
   */
  header?: ReactNode;
  /**
   * Bottom slot — pinned to the nav's bottom edge (the band the product fills
   * with "Ask Ramp"; ours is "About DD" → diegodiaz.dev); compose with
   * SideMenuAction. Renders outside the <ul>.
   */
  footer?: ReactNode;
  className?: string;
  /** Accessible label for the nav landmark (e.g. "Main navigation"). */
  'aria-label'?: string;
}

export interface SideMenuItemProps extends PropsWithChildren {
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

export interface SideMenuHeaderProps extends PropsWithChildren {
  /**
   * The workspace glyph before the name (the updated nav shows a small mark
   * beside "Clara Media LLC"). Rendered hushed, like the item icons.
   */
  icon?: ReactNode;
  /** Fires the workspace switcher (the chevron is a switch affordance). */
  onClick?: () => void;
  /** Bone hairline beneath the band (the frame's border under the header). */
  divider?: boolean;
  className?: string;
}

export interface SideMenuProgressProps {
  /** Block title — the updated nav's onboarding row reads "Setup guide". */
  title: ReactNode;
  /** Sub-line under the title, e.g. "Next: Move your spend onto Ramp". */
  subtitle?: ReactNode;
  /** Leading glyph for the title row (rendered hushed, like the item icons). */
  icon?: ReactNode;
  /** Completion 0–100; clamped, drives the green fill's width. */
  value: number;
  /** Fires when the row is activated (the block is a link into onboarding). */
  onClick?: () => void;
  /** Bone hairline beneath the block (the frame's border under the setup row). */
  divider?: boolean;
  className?: string;
}

/**
 * SideMenu container — the full-height nav sidebar.
 * Renders a <nav> with limestone background and houses the item list, with
 * optional header (logo) and footer (Ask Ramp) slots pinned outside the list.
 */
export function SideMenu({
  children,
  header,
  footer,
  className,
  'aria-label': ariaLabel,
}: SideMenuProps) {
  return (
    <nav
      aria-label={ariaLabel ?? 'Main navigation'}
      className={cn(
        // overflow-auto: the nav is its own scroll container — when the item
        // list outgrows the parent, the items scroll WITHIN the limestone
        // background instead of spilling onto the white page canvas (which is
        // what a plain h-full/min-h-full background pin allowed). With the
        // header/footer slots the <ul> below is the PRIMARY scroll region
        // (flex-1 min-h-0), so the logo and Ask Ramp stay pinned while the
        // items scroll — this nav-level overflow remains the backstop.
        'bg-limestone w-64 flex flex-col overflow-auto',
        // Sharp 0px corners (vetted across all frames).
        'rounded-square',
        className,
      )}
    >
      {header !== undefined && (
        // The header band. In the frames this holds either the bare brand mark
        // (product-overview/01: the swoosh at x14-28 y12-26) or the richer
        // workspace stack — SideMenuHeader + SideMenuProgress, each owning its
        // own bone hairline. The slot keeps the item gutter (px-rui-2) so those
        // controls line up with the list below; a bare Logo just sits in it.
        <div className="gap-rui-1 px-rui-2 pt-rui-3 flex flex-shrink-0 flex-col">{header}</div>
      )}
      {/* gap-rui-2 between entries keeps the items breathing without butting up
          against each other or a section divider. */}
      <ul className="min-h-0 gap-rui-2 p-rui-2 flex flex-1 flex-col overflow-auto">{children}</ul>
      {footer !== undefined && (
        // Pinned bottom band (product-overview/01: Ask Ramp at y604-614, on
        // the same limestone — no divider or tint separates it in the frame).
        <div className="p-rui-2 mt-auto flex-shrink-0">{footer}</div>
      )}
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
      <span className="text-sm font-body flex-1 truncate text-left">{children}</span>
      {badge !== undefined && badge > 0 && (
        // The Badge primitive in its accent/solid tone (bg-accent + text-ink).
        // shape="pill": DESIGN DECISION — nav counts are fully-rounded pills,
        // matching the count badges the Tabs bar established (overrides the
        // 0px-corner frame reading; codified in sidemenu-fidelity.spec.ts).
        <Badge
          tone="accent"
          variant="solid"
          shape="pill"
          className="flex-shrink-0"
          aria-label={`${badge} items`}
        >
          {badge}
        </Badge>
      )}
    </>
  );

  return (
    <li>
      <Component
        onClick={onClick}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'gap-rui-2 px-rui-3 py-rui-2 flex w-full items-center rounded-[6px]',
          'transition-colors outline-none',
          // Active: stone background (vetted #e5e0dc) + ink text (vetted #0b0704–#2c2825).
          // Inactive: transparent + hushed text (vetted #6f6e6a).
          active
            ? ACTIVE_ITEM_CLASS
            : 'text-hushed hover:bg-limestone hover:text-ink bg-transparent',
          // Focus ring: accent lime, 2px offset (control-ring standard).
          'focus-visible:ring-control-ring focus-visible:ring-2 focus-visible:ring-offset-2',
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
    <li role="separator" aria-hidden className={cn('my-rui-2', className)}>
      <hr className="border-bone border-t" />
    </li>
  );
}

/**
 * SideMenuHeader — the workspace band at the top of the updated nav: a small
 * mark, the company name, and a chevron-down switch affordance, over a bone
 * hairline (the "border beneath data" the frame shows under the header).
 *
 * Goes in the SideMenu `header` slot. Renders a <button> (the chevron is a
 * workspace switcher) so it's a real control, not decoration; the label is ink,
 * the mark + chevron are hushed — the item palette.
 */
export function SideMenuHeader({
  children,
  icon,
  onClick,
  divider = true,
  className,
}: SideMenuHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'gap-rui-2 rounded-square px-rui-2 py-rui-1 flex w-full items-center',
        'text-sm font-body text-hushed transition-colors outline-none',
        'hover:bg-limestone cursor-pointer',
        'focus-visible:ring-control-ring focus-visible:ring-2 focus-visible:ring-offset-2',
        divider && 'border-bone pb-rui-2 mb-rui-1 border-b',
        className,
      )}
    >
      {icon && (
        <span className="text-hushed flex-shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate text-left">{children}</span>
      <span className="text-hushed flex-shrink-0" aria-hidden>
        <ChevronDown size={16} />
      </span>
    </button>
  );
}

/**
 * SideMenuProgress — the onboarding block under the header (the frame's "Setup
 * guide" row + "Next: Move your spend onto Ramp" sub-line + a green progress
 * bar on a gray track).
 *
 * The bar is a real ARIA progressbar. Fill is `--rui-positive` (the verified
 * constructive green) on a `--rui-bone` track — both tokens, no raw hex. The
 * block is a link into onboarding (a <button>); the whole thing sits over a
 * bone hairline like the header, so it reads as its own delimited section.
 */
export function SideMenuProgress({
  title,
  subtitle,
  icon,
  value,
  onClick,
  divider = true,
  className,
}: SideMenuProgressProps) {
  // Clamp to a valid percentage — a caller passing 140 or -5 can't overrun the
  // track or invert the fill.
  const pct = Math.max(0, Math.min(100, value));
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'gap-rui-1 rounded-square px-rui-2 py-rui-1 flex w-full flex-col',
        'text-left transition-colors outline-none',
        'hover:bg-limestone cursor-pointer',
        'focus-visible:ring-control-ring focus-visible:ring-2 focus-visible:ring-offset-2',
        divider && 'border-bone pb-rui-2 mb-rui-1 border-b',
        className,
      )}
    >
      <span className="gap-rui-2 text-sm font-body text-ink flex items-center">
        {icon && (
          <span className="text-hushed flex-shrink-0" aria-hidden>
            {icon}
          </span>
        )}
        <span className="truncate">{title}</span>
      </span>
      {subtitle && <span className="text-xs font-body text-hushed truncate">{subtitle}</span>}
      <span
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        // Track: bone, the neutral rail. Full-width, thin, pill-capped ends.
        className="bg-bone rounded-pill mt-rui-1 h-1 w-full overflow-hidden"
      >
        {/* Fill: positive green (verified constructive token), width = completion. */}
        <span className="bg-positive rounded-pill block h-full" style={{ width: `${pct}%` }} />
      </span>
    </button>
  );
}

export interface SideMenuActionProps extends PropsWithChildren {
  /** Leading glyph — the product shows a spark; rendered in hushed (vetted). */
  icon?: ReactNode;
  onClick?: () => void;
  /**
   * Destination — renders an <a> instead of a <button>. An EXTERNAL href
   * (http[s]:// or protocol-relative) opens in a new tab with no referrer
   * (the "About DD" → diegodiaz.dev showcase); an INTERNAL href (e.g.
   * "/design-system", the app-shell's Storybook embed) navigates in place so
   * the surrounding layout persists.
   */
  href?: string;
  className?: string;
}

/** An href that leaves the app (absolute http[s] or protocol-relative). */
function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href);
}

/**
 * SideMenuAction — the footer-slot action (the slot the product fills with
 * "Ask Ramp"; this system fills it with "About DD" → diegodiaz.dev, or, in the
 * app shell, "Go to Design System" → /design-system).
 *
 * NOT a nav item: it lives outside the <ul> (no li), acts (or links out)
 * rather than navigating the app, and its colors differ from items — VETTED
 * on product-overview/01 (1px): label junctions #4f4e4a (INK, darker than the
 * hushed items), spark glyph #7a7975 (HUSHED). Hover/focus reuse the item
 * conventions (limestone hover, control-ring focus) — INFERRED, no hover frame.
 */
export function SideMenuAction({ children, icon, onClick, href, className }: SideMenuActionProps) {
  const Component = href ? 'a' : 'button';
  // Only external links open a new tab; an internal route navigates in place.
  const external = href ? isExternalHref(href) : false;
  return (
    <Component
      type={href ? undefined : 'button'}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={onClick}
      className={cn(
        'gap-rui-2 px-rui-3 py-rui-2 flex w-full items-center rounded-[6px]',
        // Label is INK (vetted #4f4e4a junctions on product-overview/01, darker
        // than the hushed nav items) — the spark glyph below stays HUSHED.
        'text-sm font-body text-ink transition-colors outline-none',
        'hover:bg-limestone',
        'focus-visible:ring-control-ring focus-visible:ring-2 focus-visible:ring-offset-2',
        'cursor-pointer',
        className,
      )}
    >
      {icon && (
        <span className="text-hushed shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate text-left">{children}</span>
    </Component>
  );
}
