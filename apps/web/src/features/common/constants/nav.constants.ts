import {
  Building,
  Building2,
  Calculator,
  House,
  Landmark,
  LineChart,
  PlaneTakeoff,
  Receipt,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from '@ramps/ui/icons';

import type { NavSection } from '../helpers/nav.helpers';

/**
 * NAV_SECTIONS — the single source for both the rendered nav and the route
 * table. Icons are stored as COMPONENT references (not rendered JSX) so this
 * stays plain data — a `.constants.ts` the CommonSideMenu renders and the tests
 * walk without a DOM; the `NavItem`/`NavSection` shapes and the
 * active/uniqueness logic live in nav.helpers.
 *
 * Vetted against the newer product shell
 * (docs/watch-youtube/does-ramp-live-up-to-the-hype…/04-processing-invoice-skeleton-row.jpeg):
 * three sections separated by hairline rules — Home/Insights · Manage
 * spend…Financial accounts · Accounting…Company — with the active "Bill Pay".
 * Bill Pay is the only destination this build actually implements; every other
 * item still routes to a real page so the sidebar never dead-ends.
 *
 * Icons come from the kit's icon door (`@ramps/ui/icons`), never a raw provider.
 */
export const NAV_SECTIONS: NavSection[] = [
  [
    { label: 'Home', href: '/', icon: House, badge: 2 },
    { label: 'Insights', href: '/insights', icon: LineChart },
  ],
  [
    { label: 'Manage spend', href: '/manage-spend', icon: Wallet },
    { label: 'Expenses', href: '/expenses', icon: Receipt },
    { label: 'Travel', href: '/travel', icon: PlaneTakeoff },
    { label: 'Bill Pay', href: '/bills', icon: ReceiptText, badge: 1 },
    { label: 'Financial accounts', href: '/financial-accounts', icon: Landmark },
  ],
  [
    { label: 'Accounting', href: '/accounting', icon: Calculator },
    { label: 'Vendors', href: '/vendors', icon: Building2 },
    { label: 'Policy', href: '/policy', icon: ShieldCheck },
    { label: 'Company', href: '/company', icon: Building },
  ],
];
