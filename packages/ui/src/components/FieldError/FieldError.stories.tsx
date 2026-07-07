import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldError } from './FieldError';

const meta = {
  title: 'Primitives/FieldError',
  component: FieldError,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FieldError>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single message — pass a react-hook-form `error.message` string straight in. */
export const Single: Story = {
  args: { children: 'Invoice number must be at least 8 characters.' },
};

/** Several messages (e.g. a zod `flatten().fieldErrors[name]` `string[]`). */
export const Multiple: Story = {
  args: {
    children: [
      'Invoice number must be at least 8 characters.',
      'Invoice number may only contain letters, digits and dashes.',
    ],
  },
};

/** The larger `sm` size — a standalone, form-level error (not beneath a field). */
export const Standalone: Story = {
  args: {
    size: 'sm',
    children: 'Could not save the approval route. Your last change may not be persisted.',
  },
};

/** Empty/whitespace messages are filtered out — this renders nothing. */
export const Empty: Story = { args: { children: ['', '   '] } };
