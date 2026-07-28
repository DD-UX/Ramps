import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowRight,
  BookOpen,
  Building,
  CircleDot,
  CreditCard,
  FileStack,
  FileText,
  Home,
  Landmark,
  Plane,
  Receipt,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import { Logo } from '../Logo/Logo';
import {
  SideMenu,
  SideMenuAction,
  SideMenuDivider,
  SideMenuHeader,
  SideMenuItem,
  SideMenuProgress,
} from './SideMenu';

const meta = {
  title: 'Primitives/SideMenu',
  component: SideMenu,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SideMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Full replica of the Ramp Bill Pay nav from the product frames.
 * VETTED structure from product-overview/02-fraud-duplicate-warnings.jpeg:
 *  - Home (badge: 90)
 *  - Insights
 *  - Manage spend
 *  - Expenses
 *  - Travel
 *  - Bill Pay (ACTIVE)
 *  - Treasury
 *  - [DIVIDER]
 *  - Accounting (badge: 383)
 *  - Vendors (badge: 3)
 *  - Policy
 *  - Company (badge: 1)
 *
 * Top and bottom bands from product-overview/01-dashboard-drafts-tab.jpeg:
 * the brand mark at the nav's top-left (`header` slot, our two-ramp Logo) and
 * the pinned bottom band the product fills with "Ask Ramp" (`footer` slot,
 * SideMenuAction with the spark glyph — text vetted ink, glyph vetted hushed).
 * Ours says "About DD" and links out to https://www.diegodiaz.dev/.
 */
/**
 * The spend run both product shells share — Manage spend → Expenses → Travel →
 * the active Bill Pay. The stories differ around it (badges, sections, richer
 * chrome), not inside it.
 */
const spendRun = (
  <>
    <SideMenuItem icon={<Wallet size={16} />}>Manage spend</SideMenuItem>
    <SideMenuItem icon={<Receipt size={16} />}>Expenses</SideMenuItem>
    <SideMenuItem icon={<Plane size={16} />}>Travel</SideMenuItem>
    <SideMenuItem icon={<FileText size={16} />} active>
      Bill Pay
    </SideMenuItem>
  </>
);

export const RampBillPayReplica: Story = {
  render: () => (
    <SideMenu
      aria-label="Bill Pay navigation"
      header={<Logo />}
      footer={
        <SideMenuAction icon={<Sparkles size={16} />} href="https://www.diegodiaz.dev/">
          About DD
        </SideMenuAction>
      }
    >
      <SideMenuItem icon={<Home size={16} />} badge={90}>
        Home
      </SideMenuItem>
      <SideMenuItem icon={<TrendingUp size={16} />}>Insights</SideMenuItem>
      {spendRun}
      <SideMenuItem icon={<CreditCard size={16} />}>Treasury</SideMenuItem>
      <SideMenuDivider />
      <SideMenuItem icon={<BookOpen size={16} />} badge={383}>
        Accounting
      </SideMenuItem>
      <SideMenuItem icon={<Users size={16} />} badge={3}>
        Vendors
      </SideMenuItem>
      <SideMenuItem icon={<FileStack size={16} />}>Policy</SideMenuItem>
      <SideMenuItem icon={<Building size={16} />} badge={1}>
        Company
      </SideMenuItem>
    </SideMenu>
  ),
};

/**
 * Updated nav — the newer product shell from
 * does-ramp-live-up-to-the-hype…/04-processing-invoice-skeleton-row.jpeg.
 *
 * Everything the replica has, plus the frame's richer chrome vetted from that
 * crop: a workspace HEADER (a mark + "Clara Media LLC" + a chevron switcher,
 * over a bone hairline), a SETUP-GUIDE progress block ("Next: Move your spend
 * onto Ramp" with a ~30% green bar), and the items split into sections by
 * hairline rules (Home/Insights · Manage spend…Financial accounts ·
 * Accounting…Company) with the active "Bill Pay". The footer is still the
 * primitive's "About DD" showcase — the APP shell (CommonSideMenu) is where
 * that band becomes "Go to Design System".
 */
export const UpdatedNav: Story = {
  render: () => (
    <SideMenu
      aria-label="Bill Pay navigation"
      header={
        <>
          <SideMenuHeader icon={<CircleDot size={16} />}>Clara Media LLC</SideMenuHeader>
          <SideMenuProgress
            icon={<Rocket size={16} />}
            title="Setup guide"
            subtitle="Next: Move your spend onto Ramp"
            value={30}
          />
        </>
      }
      footer={
        <SideMenuAction icon={<Sparkles size={16} />} href="https://www.diegodiaz.dev/">
          About DD
        </SideMenuAction>
      }
    >
      {/* Section 1 — a plain run of items on the limestone. */}
      <SideMenuItem icon={<Home size={16} />} badge={2}>
        Home
      </SideMenuItem>
      <SideMenuItem icon={<TrendingUp size={16} />}>Insights</SideMenuItem>
      <SideMenuDivider />
      {/* Section 2 — the active "Bill Pay" sits in a plain run with the rest. */}
      {spendRun}
      <SideMenuItem icon={<Landmark size={16} />}>Financial accounts</SideMenuItem>
      <SideMenuDivider />
      {/* Section 3 — another plain run. */}
      <SideMenuItem icon={<BookOpen size={16} />}>Accounting</SideMenuItem>
      <SideMenuItem icon={<Store size={16} />}>Vendors</SideMenuItem>
      <SideMenuItem icon={<SlidersHorizontal size={16} />}>Policy</SideMenuItem>
      <SideMenuItem icon={<Building size={16} />}>Company</SideMenuItem>
    </SideMenu>
  ),
};

/**
 * Scoped nav — the shape the APP ships. The information architecture is the
 * product's in full, but only the destinations this build owns are LINKS; the
 * rest are `disabled` and carry a `hint` explaining why.
 *
 * The point is honesty without amputation. Deleting the unbuilt items would
 * misreport the product's shape; routing them to placeholder pages turns the
 * sidebar into a list of things that weren't done. Inert-with-a-reason says
 * "this is the map, and here is the part I built" — one dimmed row, no dead end.
 *
 * A disabled item is a `<button aria-disabled>`, never a link (an aria-disabled
 * anchor still navigates on Enter), and it stays FOCUSABLE so a keyboard user
 * can reach the hint. The bubble opens BELOW because the item list is its own
 * scroll box and would clip a bubble above the first row.
 */
const OUT_OF_SCOPE = 'Out of scope for this build — Bill Pay is the focus.';

export const ScopedNav: Story = {
  render: () => (
    <SideMenu
      aria-label="Bill Pay navigation"
      header={<SideMenuHeader icon={<CircleDot size={16} />}>Ramps Demo</SideMenuHeader>}
      footer={
        <SideMenuAction icon={<ArrowRight size={16} />} href="/design-system">
          Design System
        </SideMenuAction>
      }
    >
      <SideMenuItem icon={<Home size={16} />} disabled hint={OUT_OF_SCOPE}>
        Home
      </SideMenuItem>
      <SideMenuItem icon={<TrendingUp size={16} />} badge={2} disabled hint={OUT_OF_SCOPE}>
        Insights
      </SideMenuItem>
      <SideMenuDivider />
      <SideMenuItem icon={<Wallet size={16} />} disabled hint={OUT_OF_SCOPE}>
        Manage spend
      </SideMenuItem>
      <SideMenuItem icon={<FileText size={16} />} href="/bills" active>
        Bill Pay
      </SideMenuItem>
      <SideMenuItem icon={<Landmark size={16} />} disabled hint={OUT_OF_SCOPE}>
        Financial accounts
      </SideMenuItem>
      <SideMenuDivider />
      <SideMenuItem icon={<Store size={16} />} href="/vendors">
        Vendors
      </SideMenuItem>
      <SideMenuItem icon={<Building size={16} />} disabled hint={OUT_OF_SCOPE}>
        Company
      </SideMenuItem>
    </SideMenu>
  ),
};

/**
 * Design-system footer — the APP-shell variant where the pinned band links
 * INTERNALLY to `/design-system` (the in-app Storybook embed) with a trailing
 * arrow, instead of the primitive showcase's external "About DD". Same slot,
 * same treatment; the destination and glyph are the difference.
 */
export const DesignSystemFooter: Story = {
  render: () => (
    <SideMenu
      aria-label="Bill Pay navigation"
      header={<SideMenuHeader icon={<CircleDot size={16} />}>Clara Media LLC</SideMenuHeader>}
      footer={
        <SideMenuAction icon={<ArrowRight size={16} />} href="/design-system">
          Go to Design System
        </SideMenuAction>
      }
    >
      <SideMenuItem icon={<Home size={16} />}>Home</SideMenuItem>
      <SideMenuItem icon={<FileText size={16} />} active>
        Bill Pay
      </SideMenuItem>
    </SideMenu>
  ),
};

/**
 * Default — minimal nav with a few items, one active, no badges.
 */
export const Default: Story = {
  render: () => (
    <SideMenu>
      <SideMenuItem icon={<Home size={16} />}>Home</SideMenuItem>
      <SideMenuItem icon={<FileText size={16} />} active>
        Bill Pay
      </SideMenuItem>
      <SideMenuItem icon={<Users size={16} />}>Vendors</SideMenuItem>
    </SideMenu>
  ),
};

/**
 * With badges — multiple items carrying count badges.
 */
export const WithBadges: Story = {
  render: () => (
    <SideMenu>
      <SideMenuItem icon={<Home size={16} />} badge={12}>
        Home
      </SideMenuItem>
      <SideMenuItem icon={<Receipt size={16} />} badge={5}>
        Expenses
      </SideMenuItem>
      <SideMenuItem icon={<FileText size={16} />} active>
        Bill Pay
      </SideMenuItem>
      <SideMenuItem icon={<BookOpen size={16} />} badge={99}>
        Accounting
      </SideMenuItem>
    </SideMenu>
  ),
};

/**
 * With divider — demonstrates section separation.
 */
export const WithDivider: Story = {
  render: () => (
    <SideMenu>
      <SideMenuItem icon={<Home size={16} />}>Home</SideMenuItem>
      <SideMenuItem icon={<Receipt size={16} />}>Expenses</SideMenuItem>
      <SideMenuItem icon={<FileText size={16} />} active>
        Bill Pay
      </SideMenuItem>
      <SideMenuDivider />
      <SideMenuItem icon={<BookOpen size={16} />}>Accounting</SideMenuItem>
      <SideMenuItem icon={<Users size={16} />}>Vendors</SideMenuItem>
    </SideMenu>
  ),
};

/**
 * No icons — items without leading icons (uncommon in the product, but supported).
 */
export const NoIcons: Story = {
  render: () => (
    <SideMenu>
      <SideMenuItem>Home</SideMenuItem>
      <SideMenuItem active>Bill Pay</SideMenuItem>
      <SideMenuItem badge={5}>Vendors</SideMenuItem>
    </SideMenu>
  ),
};

/**
 * Interactive — wire onClick handlers for client-side routing.
 */
export const Interactive: Story = {
  render: () => (
    <SideMenu>
      <SideMenuItem icon={<Home size={16} />} onClick={() => console.log('Navigate to Home')}>
        Home
      </SideMenuItem>
      <SideMenuItem
        icon={<FileText size={16} />}
        active
        onClick={() => console.log('Navigate to Bill Pay')}
      >
        Bill Pay
      </SideMenuItem>
      <SideMenuItem icon={<Users size={16} />} onClick={() => console.log('Navigate to Vendors')}>
        Vendors
      </SideMenuItem>
    </SideMenu>
  ),
};
