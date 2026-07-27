'use client';

import { cn } from '@ramps/ui/cn';
import { LayoutPanelTop, Rocket } from '@ramps/ui/icons';
import { Logo } from '@ramps/ui/Logo';
import {
  SideMenu,
  SideMenuAction,
  SideMenuDivider,
  SideMenuHeader,
  SideMenuItem,
  type SideMenuLinkComponent,
  SideMenuProgress,
} from '@ramps/ui/SideMenu';
import { Spinner } from '@ramps/ui/Spinner';
import { useDelayedFlag } from '@ramps/ui/useDelayedFlag';
import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { NAV_SECTIONS, NAV_UNIMPLEMENTED_HINT } from '../constants/nav.constants';
import { isNavItemActive, type NavItem } from '../helpers/nav.helpers';

/**
 * CommonSideMenu — the app's persistent left navigation.
 *
 * Rebuilt against the newer product shell
 * (docs/watch-youtube/does-ramp-live-up-to-the-hype…/04-processing-invoice-skeleton-row.jpeg,
 * which the video vets as more current than the earlier frames): a workspace
 * HEADER ("Clara Media LLC" + a chevron switcher over a hairline), a SETUP-GUIDE
 * progress block, and the items split into SECTIONS by hairline rules. The
 * footer band — the slot the product fills with "Ask Ramp" — links INTERNALLY
 * to /design-system (the in-app Storybook embed) so the surrounding layout
 * persists around the kit browser.
 *
 * The nav DATA (NAV_SECTIONS) lives in constants/nav.constants and the
 * active/uniqueness LOGIC in helpers/nav.helpers, so both are unit-tested
 * without a DOM; this component is just the render.
 */

/**
 * The busy glyph for a nav destination whose page hasn't arrived yet.
 *
 * `useLinkStatus` reports the pending state of the ENCLOSING `<Link>`, so it can
 * only be called from a descendant of one — which is exactly why this lives in
 * the app and not in `SideMenuItem`. The primitive builds its own children
 * (icon · label · badge) and has no slot the app could inject into, and even if
 * it did, `@ramps/ui` carries no framework dependency: the hook is a `next/link`
 * export. Rendering it as an extra child of the injected link is the one seam
 * that satisfies both constraints.
 *
 * `useDelayedFlag` is the same anti-flash gate the ProgressBar rail uses. It
 * matters more here than anywhere: nav routes are prefetched (see NavLink), so
 * the overwhelmingly common case is a warm click that commits in a frame or two.
 * Without the delay every sidebar click would blink a spinner it never needed —
 * precisely the "glitchy" impression this work exists to remove. The spinner
 * appears only when a nav genuinely stalls, e.g. a cold route or a slow query.
 *
 * It is positioned ABSOLUTELY at the item's trailing edge rather than appended
 * to the row's flex line, so raising it cannot re-flow the label or shift the
 * badge. Caveat by construction: it would sit over a trailing count badge, and
 * today it cannot — the only linkable items (Bill Pay, Vendors, the Design
 * System footer action) carry no badge, and every badged entry in NAV_SECTIONS
 * is `disabled`, which renders a button rather than a link.
 */
function NavLinkPending() {
  const { pending } = useLinkStatus();
  const visible = useDelayedFlag(pending);
  if (!visible) return null;
  return (
    <span className="right-rui-3 pointer-events-none absolute top-1/2 flex -translate-y-1/2">
      <Spinner size="sm" label="Loading page" />
    </span>
  );
}

/**
 * The router link the design system renders for every nav destination.
 *
 * `@ramps/ui` deliberately carries no framework dependency, so SideMenuItem's
 * default link element is a bare `<a>` — and a bare `<a>` makes every sidebar
 * click a FULL DOCUMENT RELOAD: new HTML, new JS parse, the whole shell torn
 * down and rebuilt. Injecting `next/link` here turns those into client-side
 * transitions.
 *
 * `prefetch` is forced ON: these routes read from the database, so Next treats
 * them as dynamic and (by default) prefetches only their loading boundary. The
 * data set behind this demo is small enough that warming the whole payload on
 * hover/viewport is free — and it's what makes the destination feel already
 * there when you click. The pending spinner rides along for the cases where
 * that warming didn't finish in time.
 */
const NavLink: SideMenuLinkComponent = ({ href, className, children, ...rest }) => (
  // `relative` is the positioning context NavLinkPending anchors to; everything
  // else about the row's look still comes from the primitive's own classes.
  <Link href={href} prefetch className={cn('relative', className)} {...rest}>
    {children}
    <NavLinkPending />
  </Link>
);

export function CommonSideMenu() {
  const pathname = usePathname();

  // One item → one <SideMenuItem>; the item whose href matches the route wins
  // the active highlight. The icon is stored as a component (data, not JSX), so
  // it's instantiated here at the render edge.
  //
  // A `disabled` item is a destination the product HAS but this build doesn't:
  // it renders inert (no href reaches the primitive) with a hint explaining
  // why, instead of linking to a placeholder page that admits nothing was done.
  const renderItem = ({ icon: Icon, ...item }: NavItem) => (
    <SideMenuItem
      key={`${item.href}:${item.label}`}
      icon={<Icon width={16} height={16} />}
      href={item.href}
      linkComponent={NavLink}
      active={isNavItemActive(item.href, pathname)}
      badge={item.badge}
      disabled={item.disabled}
      hint={item.disabled ? NAV_UNIMPLEMENTED_HINT : undefined}
    >
      {item.label}
    </SideMenuItem>
  );

  return (
    <SideMenu
      header={
        <>
          {/* Workspace switcher — the Ramp swoosh mark + workspace name. The row
              is sized to `py-rui-3` so it lines up with the CommonTopBar's own
              band (same 12px vertical padding), keeping the nav header and the
              top bar on one horizontal line. No hairline under it (`divider`
              off) — the switcher reads as one piece with the setup block below. */}
          <SideMenuHeader
            icon={<Logo size={16} aria-label="Ramps" />}
            divider={false}
            className="py-rui-3"
          >
            Ramps Demo
          </SideMenuHeader>
          <SideMenuProgress
            icon={<Rocket width={16} height={16} />}
            title="Setup guide"
            subtitle="Next: Move your spend onto Ramp"
            value={30}
          />
        </>
      }
      footer={
        <SideMenuAction
          href="/design-system"
          linkComponent={NavLink}
          className="h-8"
          icon={<LayoutPanelTop width={16} />}
        >
          Design System
        </SideMenuAction>
      }
      aria-label="Main navigation"
    >
      {NAV_SECTIONS.map((section, sectionIndex) => (
        <Fragment key={section.map((entry) => entry.label).join('|')}>
          {/* Hairline between sections (the frame's three divider rules). */}
          {sectionIndex > 0 && <SideMenuDivider />}
          {section.map(renderItem)}
        </Fragment>
      ))}
    </SideMenu>
  );
}
