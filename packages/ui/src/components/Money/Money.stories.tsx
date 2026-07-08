import type { Meta, StoryObj } from '@storybook/react-vite';

import { Money } from './Money';

const meta = {
  title: 'Primitives/Money',
  component: Money,
  parameters: { layout: 'centered' },
  args: { cents: 129755, currency: 'USD' },
} satisfies Meta<typeof Money>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { cents: 129755 } };
export const Large: Story = { args: { cents: 1429312454 } };
export const Muted: Story = { args: { cents: -8250, muted: true } };
export const Euro: Story = { args: { cents: 26250, currency: 'EUR', locale: 'de-DE' } };

/** The monospace variant used for coded amounts in the line-item grid (§07). */
export const Mono: Story = { args: { cents: 26250, mono: true } };

/**
 * The `locale` prop drives the `,`/`.` ORDER, not just the symbol: the same
 * 1,234,567 cents renders "$12,345.67" (en-US), "12.345,67 €" (de-DE) and
 * "$ 12.345,67" (es-AR) — group/decimal separators flip per locale.
 */
export const LocaleSeparators: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 4 }}>
      <Money cents={1234567} currency="USD" locale="en-US" className="block" />
      <Money cents={1234567} currency="EUR" locale="de-DE" className="block" />
      <Money cents={1234567} currency="ARS" locale="es-AR" className="block" />
    </div>
  ),
};

/** Tabular numerals keep a real column aligned regardless of magnitude. */
export const Column: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 4, width: 180 }}>
      {[129755, 82500, 10658, 1429312454, 26250].map((c) => (
        <Money key={c} cents={c} className="block" />
      ))}
    </div>
  ),
};
