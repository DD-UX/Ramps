import type { Meta, StoryObj } from '@storybook/react-vite';

import type { TableColumn } from './Table';
import {
  TableCustomFooter,
  type TableFooterGeometry,
  TablePaginationFooter,
  TableSummaryFooter,
} from './TableFooter';

/**
 * TableFooter stories — the three footer kinds Table composes, shown in
 * isolation.
 *
 * The SUMMARY and CUSTOM footers render a `<tr>`/`<td>` fragment only valid
 * inside a `<table><tfoot>`, so those stories wrap them in a minimal table with
 * a matching `<thead>` (the thead pins the column widths the footer cells line
 * up under). The PAGINATION band is a standalone `<div>` (Table pins it to the
 * scroll floor, outside the table), so its stories render it directly on a
 * canvas band — exactly how Table mounts it.
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

/**
 * The geometry Table computes and threads into every footer. This base is the
 * NON-selectable shape (no checkbox column), so `stickyCheckboxes` is off — the
 * pin only means something when there IS a selection gutter to pin.
 */
const geometry: TableFooterGeometry<DemoRow, string> = {
  columns,
  selectable: false,
  stickyLeft: undefined,
  stickyRight: undefined,
  checkboxWidth: 0,
  checkboxCellStyle: { width: '1%', minWidth: 0, maxWidth: 0 },
  stickyCheckboxes: false,
};

/**
 * Same geometry, but with a selection gutter so the footer reserves it — and
 * with the checkbox column pinned left (`stickyCheckboxes: true`), the vetted
 * default for a table that shows a selection column.
 */
const selectableGeometry: TableFooterGeometry<DemoRow, string> = {
  ...geometry,
  selectable: true,
  checkboxWidth: 56,
  checkboxCellStyle: { width: '1%', minWidth: 56, maxWidth: 56 },
  stickyCheckboxes: true,
};

/**
 * Mounts a SUMMARY/CUSTOM footer <tr> inside a valid table so it renders
 * standalone (those stay a real <tfoot> under the body in Table).
 */
function FooterFrame({
  children,
  selectable = false,
}: {
  children: React.ReactNode;
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
      <tfoot className="bg-white">{children}</tfoot>
    </table>
  );
}

/**
 * Wraps the PAGINATION band on the vetted canvas surface, the width Table gives
 * it (full scroll-region width). It's a plain <div>, so no table is needed.
 */
function BandFrame({ children }: { children: React.ReactNode }) {
  return <div className="bg-canvas rounded-square overflow-hidden">{children}</div>;
}

const meta = {
  title: 'Primitives/TableFooter',
  component: TablePaginationFooter,
  parameters: { layout: 'padded' },
  // Default args so the render-only stories below (each supplies its own props
  // via `render`) satisfy the pagination component's required props. Every
  // story overrides them, so these are only the type/controls baseline.
  args: {
    page: 1,
    pageSize: 7,
    totalCount: 7,
    onSelectPage: () => {},
    onClearSelection: () => {},
    selectionSize: 0,
  },
} satisfies Meta<typeof TablePaginationFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The vetted pagination band: "Select ⌄" on the left, the clickable range +
 * "of N bills · $TOTAL total" on the right, on a canvas band.
 */
export const Pagination: Story = {
  render: () => (
    <BandFrame>
      <TablePaginationFooter
        page={1}
        pageSize={7}
        totalCount={7}
        noun="bills"
        totalCents={149408}
        onSelectPage={() => {}}
        onClearSelection={() => {}}
        selectionSize={0}
      />
    </BandFrame>
  ),
};

/**
 * Multi-page pagination — the range menu offers every page (here 21 records
 * across 5-record pages), and the trailing `extra` meta reads more currencies.
 */
export const PaginationMultiPage: Story = {
  render: () => (
    <BandFrame>
      <TablePaginationFooter
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
    </BandFrame>
  ),
};

/** Empty dataset — the range collapses to "0–0 of 0 bills". */
export const PaginationEmpty: Story = {
  render: () => (
    <BandFrame>
      <TablePaginationFooter
        page={1}
        pageSize={10}
        totalCount={0}
        noun="bills"
        onSelectPage={() => {}}
        onClearSelection={() => {}}
        selectionSize={0}
      />
    </BandFrame>
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
