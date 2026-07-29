import type { Meta, StoryObj } from '@storybook/react-vite';
import { Building2, FilePlus, LineChart, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '../Button/Button';
import { Money } from '../Money/Money';
import { StatusPill } from '../StatusPill/StatusPill';
import { CommandPalette, type CommandPaletteGroup } from './CommandPalette';

const meta = {
  title: 'Primitives/CommandPalette',
  component: CommandPalette,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CommandPalette>;

export default meta;

type Story = StoryObj<typeof meta>;

const BILLS = [
  { id: 'b1', vendor: 'Ramp Systems', invoice: 'INV-2041', cents: 428_000, status: 'paid' },
  {
    id: 'b2',
    vendor: 'Acme Cloud Services',
    invoice: 'INV-2042',
    cents: 1_290_00,
    status: 'awaiting_approval',
  },
  { id: 'b3', vendor: 'Northwind Traders', invoice: 'INV-2043', cents: 96_500, status: 'draft' },
  {
    id: 'b4',
    vendor: 'Globex Corporation',
    invoice: 'INV-2044',
    cents: 3_120_00,
    status: 'scheduled',
  },
] as const;

function billGroup(query: string): CommandPaletteGroup {
  const term = query.trim().toLowerCase();
  const matches = term
    ? BILLS.filter(
        (b) => b.vendor.toLowerCase().includes(term) || b.invoice.toLowerCase().includes(term),
      )
    : BILLS;
  return {
    id: 'bills',
    heading: 'Bills',
    items: matches.map((bill) => ({
      id: bill.id,
      label: bill.vendor,
      description: bill.invoice,
      icon: <ReceiptText size={16} />,
      href: `/bills/${bill.id}`,
      meta: (
        <span className="gap-rui-3 flex items-center">
          <StatusPill status={bill.status} />
          <Money cents={bill.cents} />
        </span>
      ),
    })),
  };
}

const NAV_GROUP: CommandPaletteGroup = {
  id: 'nav',
  heading: 'Go to',
  items: [
    { id: 'n1', label: 'Bill Pay', icon: <ReceiptText size={16} />, href: '/bills' },
    { id: 'n2', label: 'Vendors', icon: <Building2 size={16} />, href: '/vendors' },
    { id: 'n3', label: 'Insights', icon: <LineChart size={16} />, href: '/insights' },
  ],
};

const ACTION_GROUP: CommandPaletteGroup = {
  id: 'actions',
  heading: 'Actions',
  items: [{ id: 'a1', label: 'Create demo bill', icon: <FilePlus size={16} /> }],
};

/**
 * At rest — no query, so the palette offers destinations and actions rather
 * than an empty void. Static `open` so the gallery captures it.
 */
export const Resting: Story = {
  args: {
    open: true,
    onClose: () => {},
    query: '',
    onQueryChange: () => {},
    groups: [NAV_GROUP, ACTION_GROUP],
  },
  render: (args) => (
    <div className="h-[32rem]">
      <CommandPalette {...args} />
    </div>
  ),
};

/** Mid-search: grouped results, the first row active, amounts and pills trailing. */
export const WithResults: Story = {
  args: {
    open: true,
    onClose: () => {},
    query: 'in',
    onQueryChange: () => {},
    groups: [billGroup('in'), NAV_GROUP],
  },
  render: (args) => (
    <div className="h-[32rem]">
      <CommandPalette {...args} />
    </div>
  ),
};

/** A search in flight — the leading glyph becomes a spinner, results persist. */
export const Loading: Story = {
  args: {
    open: true,
    onClose: () => {},
    query: 'acme',
    onQueryChange: () => {},
    loading: true,
    groups: [billGroup('acme')],
  },
  render: (args) => (
    <div className="h-[32rem]">
      <CommandPalette {...args} />
    </div>
  ),
};

/** Nothing matched — the message names the query rather than shrugging. */
export const Empty: Story = {
  args: {
    open: true,
    onClose: () => {},
    query: 'zzzz',
    onQueryChange: () => {},
    groups: [],
    emptyMessage: 'No results for “zzzz”.',
  },
  render: (args) => (
    <div className="h-[32rem]">
      <CommandPalette {...args} />
    </div>
  ),
};

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const bills = billGroup(query);
    return query.trim() ? [bills] : [NAV_GROUP, ACTION_GROUP];
  }, [query]);

  return (
    <div className="p-8">
      <Button variant="ink" onClick={() => setOpen(true)}>
        Open palette
      </Button>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        emptyMessage={`No results for “${query}”.`}
      />
    </div>
  );
}

/** Open it yourself — type to filter, ↑/↓ to walk, Enter to open, Esc to close. */
export const Interactive: Story = {
  args: { open: false, onClose: () => {}, query: '', onQueryChange: () => {}, groups: [] },
  render: () => <InteractiveDemo />,
};
