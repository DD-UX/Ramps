import type { Meta, StoryObj } from '@storybook/react-vite';
import { Zap } from 'lucide-react';

import { Dropdown } from './Dropdown';

// The 1099 box mapping from ramp-bill-pay-series-1099-s §07/08: grouped by
// form ("1099-NEC" / "1099-MISC"), every row is title + "Box N" secondary
// line, the selected row carries the ⚡ glyph and a check.
const BOX_GROUPS = [
  {
    label: '1099-NEC',
    options: [
      {
        value: 'nonemployee',
        label: 'Nonemployee compensation',
        description: 'Box 1',
        glyph: <Zap size={14} />,
      },
    ],
  },
  {
    label: '1099-MISC',
    options: [
      { value: 'rents', label: 'Rents', description: 'Box 1' },
      { value: 'royalties', label: 'Royalties', description: 'Box 2' },
      { value: 'other-income', label: 'Other income', description: 'Box 3' },
      { value: 'federal-tax', label: 'Federal income tax withheld', description: 'Box 4' },
      { value: 'fishing', label: 'Fishing boat proceeds', description: 'Box 5' },
    ],
  },
];

// The line-item coding cells from ramp-bill-pay-product-overview §07.
const QUICKBOOKS_CATEGORIES = [
  { value: '6300', label: '6300 - Office Supplies', meta: 'Expense' },
  { value: '6310', label: '6310 - Software & subscriptions', meta: 'Expense' },
  { value: '1400', label: '1400 - Inventory asset', meta: 'Asset' },
  { value: '6400', label: '6400 - Consulting expense', meta: 'Expense' },
];

const meta = {
  title: 'Primitives/Dropdown',
  component: Dropdown,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The 1099 box-mapping dropdown (frames 07/08): grouped rich rows, search on
 * top, clearable trigger with glyph + secondary line, pinned "Not reportable".
 */
export const BoxMapping: Story = {
  args: {
    groups: BOX_GROUPS,
    defaultValue: 'nonemployee',
    clearable: true,
    footer: 'Not reportable',
    placeholder: 'Map to a 1099 box',
  },
};

/** Flat line-item coding list with trailing meta (account type). */
export const QuickBooksCategory: Story = {
  args: {
    options: QUICKBOOKS_CATEGORIES,
    placeholder: 'QuickBooks Category',
  },
};

/** Empty + disabled coding cell. */
export const Disabled: Story = {
  args: {
    options: QUICKBOOKS_CATEGORIES,
    placeholder: 'QuickBooks Category',
    disabled: true,
  },
};
