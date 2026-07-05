import type { Meta, StoryObj } from '@storybook/react-vite';
import { clsx } from 'clsx';
import { Check, CreditCard, Mail, MousePointerClick } from 'lucide-react';

import { SegmentedArea } from './SegmentedArea';

const meta = {
  title: 'Primitives/SegmentedArea',
  component: SegmentedArea,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SegmentedArea>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A stand-in for the snapshot-12 payout option cards — the AREA is plain
 * white, the CONTENT brings its own bordered surfaces.
 */
function OptionCard({
  icon,
  label,
  selected,
}: {
  icon: React.ReactNode;
  label: string;
  selected?: boolean;
}) {
  return (
    <div
      className={clsx(
        'relative flex flex-col items-center justify-center gap-rui-3 rounded-square border px-rui-4 py-rui-6',
        selected ? 'border-ink' : 'border-bone',
      )}
    >
      <span className="text-ink">{icon}</span>
      <span className="text-sm text-ink">{label}</span>
      {selected && (
        <Check size={14} className="absolute bottom-rui-2 right-rui-2 text-positive" />
      )}
    </div>
  );
}

/** The snapshot-12 panel: [ New card | Existing card ] over the payout cards. */
export const PayByCard: Story = {
  args: {
    tabs: [
      {
        value: 'new',
        label: 'New card',
        content: (
          <div className="grid grid-cols-3 gap-rui-3">
            <OptionCard
              icon={<MousePointerClick size={20} strokeWidth={1.5} />}
              label="Pay automatically"
              selected
            />
            <OptionCard icon={<Mail size={20} strokeWidth={1.5} />} label="Send card to vendor" />
            <OptionCard icon={<CreditCard size={20} strokeWidth={1.5} />} label="Use card myself" />
          </div>
        ),
      },
      {
        value: 'existing',
        label: 'Existing card',
        content: (
          <p className="text-sm text-hushed">
            Choose one of your issued Ramp cards to pay this bill.
          </p>
        ),
      },
    ],
    defaultValue: 'new',
  },
  render: (args) => (
    <div style={{ width: 560 }}>
      <SegmentedArea {...args} />
    </div>
  ),
};
