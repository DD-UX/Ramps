'use client';

import {
  BarChart3,
  Building2,
  Calculator,
  Home,
  ReceiptText,
  ShieldCheck,
} from '@ramps/ui/icons';
import { Logo } from '@ramps/ui/Logo';
import { SideMenu, SideMenuAction, SideMenuDivider, SideMenuItem } from '@ramps/ui/SideMenu';
import { usePathname } from 'next/navigation';

/**
 * AppSideMenu — the app's persistent left navigation composing the SideMenu primitive
 * with actual nav items. Marks the active item via the current pathname.
 *
 * Nav items include Home, Bill Pay, Insights, Vendors, Accounting, and Policy —
 * each a link (href) for Next.js routing. Icons come from the kit's icon door
 * (`@ramps/ui/icons`), never a raw provider, so the whole nav re-skins from one file.
 */
export function AppSideMenu() {
  const pathname = usePathname();

  return (
    <SideMenu
      header={<Logo />}
      footer={<SideMenuAction href="https://www.diegodiaz.dev/">About DD</SideMenuAction>}
      aria-label="Main navigation"
    >
      <SideMenuItem icon={<Home width={16} height={16} />} href="/" active={pathname === '/'}>
        Home
      </SideMenuItem>

      <SideMenuItem
        icon={<ReceiptText width={16} height={16} />}
        href="/bills"
        active={pathname === '/bills'}
        badge={12}
      >
        Bill Pay
      </SideMenuItem>

      <SideMenuItem
        icon={<BarChart3 width={16} height={16} />}
        href="/insights"
        active={pathname === '/insights'}
      >
        Insights
      </SideMenuItem>

      <SideMenuDivider />

      <SideMenuItem
        icon={<Building2 width={16} height={16} />}
        href="/vendors"
        active={pathname === '/vendors'}
        badge={3}
      >
        Vendors
      </SideMenuItem>

      <SideMenuItem
        icon={<Calculator width={16} height={16} />}
        href="/accounting"
        active={pathname === '/accounting'}
        badge={383}
      >
        Accounting
      </SideMenuItem>

      <SideMenuItem
        icon={<ShieldCheck width={16} height={16} />}
        href="/policy"
        active={pathname === '/policy'}
      >
        Policy
      </SideMenuItem>
    </SideMenu>
  );
}
