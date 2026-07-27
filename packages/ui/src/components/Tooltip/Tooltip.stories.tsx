import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OnButton: Story = {
  args: {
    label: 'Approve to unlock payment',
    children: <Button variant="secondary">Pay now</Button>,
  },
};

export const RegulatoryWhy: Story = {
  args: {
    label: 'Ramp needs the vendor location to pay this bill (regulatory).',
    children: <span className="underline decoration-dotted">State (required)</span>,
  },
};

/**
 * A long label stays BOUNDED: the bubble caps at max-w-64 and the copy wraps
 * to multiple lines instead of running off-screen and offsetting the app view.
 */
export const LongLabelWraps: Story = {
  args: {
    label:
      "Ramp's agent checked this bill's coding, amount, approval chain and payment timing against the vendor's twelve most recent bills before recommending approval.",
    children: <Button variant="secondary">Why?</Button>,
  },
};

/**
 * `placement="bottom"` hangs the bubble UNDER the trigger. It exists for
 * triggers near the top of a scrolling container: a CSS-only tooltip is clipped
 * by any `overflow` ancestor, so the first item in the SideMenu's item list
 * can't put its bubble above itself — it drops it below instead.
 */
export const PlacementBottom: Story = {
  args: {
    label: 'Out of scope for this build — Bill Pay is the focus.',
    placement: 'bottom',
    children: <Button variant="secondary">Insights</Button>,
  },
};
