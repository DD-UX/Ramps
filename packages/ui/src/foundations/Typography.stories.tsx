import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Foundations/Typography — the text samples.
 *
 * One family (--rui-font-sans: Inter/Lausanne/Roboto), THREE weights doing all
 * the work: body (300) for copy and controls, heading (400) for titles and
 * emphasis, bold (700) reserved for money and hard emphasis. The product's
 * hierarchy comes from weight + color (ink vs hushed), not from a big size
 * ramp — the samples below are real strings from the Bill Pay frames.
 */
const meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function Label({ children }: { children: string }) {
  return <code className="w-56 text-xs font-body text-hushed flex-shrink-0">{children}</code>;
}

/** The three weights — body 300, heading 400, bold 700. */
export const Weights: Story = {
  render: () => (
    <div className="max-w-2xl gap-rui-4 flex flex-col">
      <div className="gap-rui-4 flex items-baseline">
        <Label>font-body · 300</Label>
        <p className="text-base font-body text-ink">Add a passkey for faster and safer sign-in</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>font-heading · 400</Label>
        <p className="text-base font-heading text-ink">Good afternoon, Hannah</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>font-bold · 700</Label>
        <p className="text-base font-bold text-ink">$150,042.75</p>
      </div>
    </div>
  ),
};

/** The size ramp — xs through 3xl, each with its house role. */
export const Sizes: Story = {
  render: () => (
    <div className="max-w-2xl gap-rui-4 flex flex-col">
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-xs · badges, table meta</Label>
        <p className="text-xs font-body text-hushed">Coded by Ramp · Oct 16, 2025</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-sm · body, nav, cells</Label>
        <p className="text-sm font-body text-ink">This draft may be a duplicate of INV# 8960.</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-base · form copy</Label>
        <p className="text-base font-body text-ink">A new card was sent on Feb 14, 2026.</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-lg · section titles</Label>
        <p className="text-lg font-heading text-ink">Payment details</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-2xl · page greetings</Label>
        <p className="text-2xl font-heading text-ink">Good afternoon, Hannah</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-3xl · page titles</Label>
        <p className="text-3xl font-heading text-ink">Bill Pay</p>
      </div>
    </div>
  ),
};

/** Color pairs on text — ink for content, hushed for meta, the alert red. */
export const TextColors: Story = {
  render: () => (
    <div className="max-w-2xl gap-rui-4 flex flex-col">
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-ink · primary</Label>
        <p className="text-sm font-body text-ink">Staples Inc. — Framingham, Massachusetts.</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-hushed · secondary</Label>
        <p className="text-sm font-body text-hushed">David Wallace · Sep 29, 2025</p>
      </div>
      <div className="gap-rui-4 flex items-baseline">
        <Label>text-alert · flagged bills</Label>
        <p className="text-sm font-body text-alert">Ramp identified $5,660.00 of overbilling.</p>
      </div>
    </div>
  ),
};
