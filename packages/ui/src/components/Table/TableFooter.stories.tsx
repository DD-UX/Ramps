import type { Meta, StoryObj } from '@storybook/react-vite';

import type { TableColumn } from './Table';
import {
  TableCustomFooter,
  type TableFooterGeometry,
  TablePaginationFooter,
  TableSummaryFooter,
} from './TableFooter';

/**
 * TableFooter stories — the three <tfoot> kinds Table composes, shown in
 * isolation. Each footer renders a `<tr>`/`<td>` fragment that is only valid
 * inside a `<table><tfoot>`, so every story wraps it in a minimal table with a
 * matching `<thead>` (the thead pins the column widths the footer cells line up
 * under). This mirrors exactly how Table.tsx mounts them.
 *
 * The rendered markup is identical to what Table emits — the structure-fidelity
 * HARD gate exercises the SAME components through the Table stories; these
 * stories are the per-state showcase the packages/ui convention asks for.
 */

/** A tiny fixture row shape for the summary columns' totals. */
interface DemoRow {
  id: string;
  vendor: string;
  amountCents: number;
}

/** Two columns: a left label column and a right-aligned money column. */
const columns: TableColumn<DemoRow, string>[] = [
  { id: 'vendor', header: 'Vendor', cell: (row) => row.vendor, width: '240px' },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => row.amountCents,
    align: 'right',
    width: '160px',
    footer: { type: 'money', cents: 149408 },
  },
];

/** The geometry Table computes and threads into every footer. */
const geometry: TableFooterGeometry<DemoRow, string> = {
  columns,
  selectable: false,
  stickyLeft: undefined,
  stickyRight: undefined,
  checkboxWidth: 0,
  checkboxCellStyle: { width: '1%', minWidth: 0, maxWidth: 0 },
};

/** Same geometry, but with a selection gutter so the footer reserves it. */
const selectableGeometry: TableFooterGeometry<DemoRow, string> = {
  ...geometry,
  selectable: true,
  checkboxWidth: 56,
  checkboxCellStyle: { width: '1%', minWidth: 56, maxWidth: 56 },
};

/**
 * Mounts a footer <tr> inside a valid table so it renders standalone. The
 * `bg` matches Table's own tfoot band (canvas for pagination, white otherwise).
 */
function FooterFrame({
  children,
  band = 'white',
  selectable = false,
}: {
  children: React.ReactNode;
  band?: 'white' | 'canvas';
  selectable?: boolean;
}) {
  return (
    <table className="border-spacing-0 text-sm w-full border-separate">
      <thead className="bg-white">
        <tr>
          {selectable && <th className="px-rui-3 py-rui-2" style={{ width: 56 }} />}
          {columns.map((col) => (
            <th
              key={col.id}
              scope="col"
              className="border-limestone px-rui-3 py-rui-2 text-xs font-heading text-hushed border-b text-left"
              style={{ width: col.width }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tfoot className={band === 'canvas' ? 'bg-canvas' : 'bg-white'}>{children}</tfoot>
    </table>
  );
}

const meta = {
  title: 'Primitives/TableFooter',
  component: TablePaginationFooter,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TablePaginationFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The vetted pagination band: "Select ⌄" on the left, the clickable range +
 * "of N bills · $TOTAL total" on the right, on a canvas band.
 */
export const Pagination: Story = {
  render: () => (
    <FooterFrame band="canvas">
      <TablePaginationFooter
        geometry={geometry}
        page={1}
        pageSize={7}
        totalCount={7}
        noun="bills"
        totalCents={149408}
        onSelectPage={() => {}}
        onClearSelection={() => {}}
        selectionSize={0}
      />
    </FooterFrame>
  ),
};

/**
 * Multi-page pagination — the range menu offers every page (here 21 records
 * across 5-record pages), and the trailing `extra` meta reads more currencies.
 */
export const PaginationMultiPage: Story = {
  render: () => (
    <FooterFrame band="canvas">
      <TablePaginationFooter
        geometry={geometry}
        page={1}
        pageSize={5}
        totalCount={21}
        noun="drafts"
        totalCents={49452080}
        extra=" + 5 more currencies"
        onSelectPage={() => {}}
        onClearSelection={() => {}}
        selectionSize={2}
      />
    </FooterFrame>
  ),
};

/** Empty dataset — the range collapses to "0–0 of 0 bills". */
export const PaginationEmpty: Story = {
  render: () => (
    <FooterFrame band="canvas">
      <TablePaginationFooter
        geometry={geometry}
        page={1}
        pageSize={10}
        totalCount={0}
        noun="bills"
        onSelectPage={() => {}}
        onClearSelection={() => {}}
        selectionSize={0}
      />
    </FooterFrame>
  ),
};

/** Per-column summary — the money column totals, the label column stays blank. */
export const Summary: Story = {
  render: () => (
    <FooterFrame>
      <TableSummaryFooter geometry={geometry} />
    </FooterFrame>
  ),
};

/** Summary with a selection gutter — the footer reserves the checkbox column. */
export const SummarySelectable: Story = {
  render: () => (
    <FooterFrame selectable>
      <TableSummaryFooter geometry={selectableGeometry} />
    </FooterFrame>
  ),
};

/** Custom slot — a single cell spanning all columns for arbitrary content. */
export const Custom: Story = {
  render: () => (
    <FooterFrame>
      <TableCustomFooter
        geometry={geometry}
        content={<span className="text-hushed">Showing archived bills only</span>}
      />
    </FooterFrame>
  ),
};
