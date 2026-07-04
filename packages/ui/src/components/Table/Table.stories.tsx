import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../Avatar/Avatar';
import { Money } from '../Money/Money';
import { StatusPill } from '../StatusPill/StatusPill';
import { Table } from './Table';

const meta = {
  title: 'Primitives/Table',
  component: Table,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Table>;

export default meta;

const rows = [
  { vendor: 'Notion Labs, Inc.', due: 'Feb 12', cents: 24_000, status: 'awaiting_approval' as const },
  { vendor: 'AWS', due: 'Feb 14', cents: 1_318_45, status: 'approved' as const },
  { vendor: 'Figma', due: 'Feb 3', cents: 45_00, status: 'paid' as const },
  { vendor: 'Gusto', due: 'Feb 1', cents: 892_10, status: 'rejected' as const },
];

/** The shells composed into a Bill Pay-style list: monogram · vendor · due · amount · status. */
export const BillsList: StoryObj = {
  render: () => (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Vendor</Table.HeaderCell>
          <Table.HeaderCell>Due</Table.HeaderCell>
          <Table.HeaderCell align="right">Amount</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r.vendor} interactive>
            <Table.Cell>
              <span className="flex items-center gap-rui-2">
                <Avatar name={r.vendor} size="sm" />
                {r.vendor}
              </span>
            </Table.Cell>
            <Table.Cell>{r.due}</Table.Cell>
            <Table.Cell align="right">
              <Money cents={r.cents} />
            </Table.Cell>
            <Table.Cell>
              <StatusPill status={r.status} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const Selected: StoryObj = {
  render: () => (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Vendor</Table.HeaderCell>
          <Table.HeaderCell align="right">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row interactive>
          <Table.Cell>Figma</Table.Cell>
          <Table.Cell align="right">
            <Money cents={4500} />
          </Table.Cell>
        </Table.Row>
        <Table.Row interactive selected>
          <Table.Cell>AWS</Table.Cell>
          <Table.Cell align="right">
            <Money cents={131845} />
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
