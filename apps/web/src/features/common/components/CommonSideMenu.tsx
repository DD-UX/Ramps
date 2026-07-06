'use client';

import { ArrowRight, Rocket, LightBulb } from '@ramps/ui/icons';
import { Logo } from '@ramps/ui/Logo';
import {
  SideMenu,
  SideMenuAction,
  SideMenuDivider,
  SideMenuHeader,
  SideMenuItem,
  SideMenuProgress,
} from '@ramps/ui/SideMenu';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { NAV_SECTIONS } from '../constants/nav.constants';
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

export function CommonSideMenu() {
  const pathname = usePathname();

  // One item → one <SideMenuItem>; the item whose href matches the route wins
  // the active highlight. The icon is stored as a component (data, not JSX), so
  // it's instantiated here at the render edge.
  const renderItem = ({ icon: Icon, ...item }: NavItem) => (
    <SideMenuItem
      key={`${item.href}:${item.label}`}
      icon={<Icon width={16} height={16} />}
      href={item.href}
      active={isNavItemActive(item.href, pathname)}
      badge={item.badge}
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
        <SideMenuAction icon={null} href="/design-system" className="h-8" icon={<LightBulb />}>
          <span className="gap-0.5 group grid grid-flow-col items-center">
            Design System{' '}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" width={16} />
          </span>
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
