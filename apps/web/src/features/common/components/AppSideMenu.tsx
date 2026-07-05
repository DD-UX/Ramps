'use client';

import {
  Building,
  Building2,
  Calculator,
  House,
  Inbox,
  Landmark,
  LayoutGrid,
  LineChart,
  Plane,
  PlaneTakeoff,
  Receipt,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from '@ramps/ui/icons';
import { Logo } from '@ramps/ui/Logo';
import { SideMenu, SideMenuAction, SideMenuDivider, SideMenuItem } from '@ramps/ui/SideMenu';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * AppSideMenu — the app's persistent left navigation.
 *
 * This reproduces Ramp's full left nav from the reference frame
 * (docs/watch-youtube/does-ramp-live-up-to-the-hype…/01-home-dashboard-left-nav.jpeg):
 * a Home cluster (Overview/Inbox/My expenses/My travel), Insights, then two
 * grouped sections split by hairline dividers — the spend group (Manage spend,
 * Expenses, Travel, Bill Pay, Financial accounts) and the back-office group
 * (Accounting, Vendors, Policy, Company).
 *
 * Bill Pay is the only destination this build actually implements; every other
 * item still routes to a real page so the sidebar never dead-ends — those pages
 * render the "Are you looking for Bill Pay?" nudge. The nav and the route table
 * grow from the same NAV config below, so a new item can't drift from its page.
 *
 * Icons come from the kit's icon door (`@ramps/ui/icons`), never a raw provider.
 */

type NavItem = { label: string; href: string; icon: ReactNode; badge?: number };

/**
 * NAV — the single source for both the rendered nav and the route table.
 * `null` entries are section dividers (the two hairlines in the frame).
 * Exported so the route layer can assert every href has a page.
 */
export const NAV: Array<NavItem | null> = [
  { label: 'Home', href: '/', icon: <House width={16} height={16} /> },
  { label: 'Overview', href: '/overview', icon: <LayoutGrid width={16} height={16} />, badge: 1 },
  { label: 'Inbox', href: '/inbox', icon: <Inbox width={16} height={16} /> },
  { label: 'My expenses', href: '/my-expenses', icon: <Receipt width={16} height={16} /> },
  { label: 'My travel', href: '/my-travel', icon: <Plane width={16} height={16} /> },
  { label: 'Insights', href: '/insights', icon: <LineChart width={16} height={16} /> },
  null,
  { label: 'Manage spend', href: '/manage-spend', icon: <Wallet width={16} height={16} /> },
  { label: 'Expenses', href: '/expenses', icon: <Receipt width={16} height={16} /> },
  { label: 'Travel', href: '/travel', icon: <PlaneTakeoff width={16} height={16} /> },
  { label: 'Bill Pay', href: '/bills', icon: <ReceiptText width={16} height={16} />, badge: 12 },
  { label: 'Financial accounts', href: '/financial-accounts', icon: <Landmark width={16} height={16} /> },
  null,
  { label: 'Accounting', href: '/accounting', icon: <Calculator width={16} height={16} />, badge: 383 },
  { label: 'Vendors', href: '/vendors', icon: <Building2 width={16} height={16} />, badge: 3 },
  { label: 'Policy', href: '/policy', icon: <ShieldCheck width={16} height={16} /> },
  { label: 'Company', href: '/company', icon: <Building width={16} height={16} /> },
];

export function AppSideMenu() {
  const pathname = usePathname();

  return (
    <SideMenu
      header={<Logo />}
      footer={<SideMenuAction href="https://www.diegodiaz.dev/">About DD</SideMenuAction>}
      aria-label="Main navigation"
    >
      {NAV.map((item, i) =>
        item === null ? (
          <SideMenuDivider key={`divider-${i}`} />
        ) : (
          <SideMenuItem
            key={item.href}
            icon={item.icon}
            href={item.href}
            active={pathname === item.href}
            badge={item.badge}
          >
            {item.label}
          </SideMenuItem>
        ),
      )}
    </SideMenu>
  );
}
