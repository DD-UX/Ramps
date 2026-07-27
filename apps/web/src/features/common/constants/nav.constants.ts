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
 *
 * SCOPE: the nav keeps the product's FULL information architecture, because the
 * shape of the IA is part of the design. What it no longer does is pretend to
 * implement it. Every destination this build doesn't own is `disabled` — inert,
 * dimmed, with a hint on hover — instead of routing to a placeholder page. The
 * placeholders were the worse lie: they turned the sidebar into a list of
 * things that weren't done. Bill Pay and Vendors are real; the rest is context.
 *
 * Icons come from the kit's icon door (`@ramps/ui/icons`), never a raw provider.
 */

/** The hover/focus copy on every unbuilt destination. */
export const NAV_UNIMPLEMENTED_HINT = 'Out of scope for this build — Bill Pay is the focus.';

export const NAV_SECTIONS: NavSection[] = [
  [
    // `/` redirects straight to Bill Pay, so Home has no page of its own here.
    { label: 'Home', href: '/', icon: House, disabled: true },
    { label: 'Insights', href: '/insights', icon: LineChart, badge: 2, disabled: true },
  ],
  [
    { label: 'Manage spend', href: '/manage-spend', icon: Wallet, disabled: true },
    { label: 'Expenses', href: '/expenses', icon: Receipt, disabled: true },
    { label: 'Travel', href: '/travel', icon: PlaneTakeoff, disabled: true },
    { label: 'Bill Pay', href: '/bills', icon: ReceiptText },
    { label: 'Financial accounts', href: '/financial-accounts', icon: Landmark, disabled: true },
  ],
  [
    { label: 'Accounting', href: '/accounting', icon: Calculator, disabled: true },
    { label: 'Vendors', href: '/vendors', icon: Building2 },
    { label: 'Policy', href: '/policy', icon: ShieldCheck, disabled: true },
    { label: 'Company', href: '/company', icon: Building, disabled: true },
  ],
];
