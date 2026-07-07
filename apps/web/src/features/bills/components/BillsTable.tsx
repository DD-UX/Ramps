'use client';

import type { BillFlagType, BillListItemType } from '@ramps/schemas/bills';
import { Money } from '@ramps/ui/Money';
import { StatusPill } from '@ramps/ui/StatusPill';
import { Table, TableAnnotationLink, type TableColumn } from '@ramps/ui/Table';
import { useRouter } from 'next/navigation';

import { formatBillDate } from '../helpers/format-date.helpers';

/**
 * BillsTable — the Bill Pay list, the product's spine (findings §1).
 *
 * A thin client wrapper over the kit `Table`: it owns the column definitions and
 * the red ↳ flag-annotation rows, nothing more. The data is already validated —
 * every row is a `BillListItemType` the SDK facade `.parse()`d at the DB
 * boundary — so this layer only maps fields to cells.
 *
 * Columns mirror the frames: Vendor (sticky-left), Invoice #, Due date,
 * Status pill, Amount (sticky-right, right-aligned tabular money). The footer is
 * the vetted pagination band with the aggregate total.
 */
export interface BillsTableProps {
  bills: BillListItemType[];
  /** Total rows for the active tab — the "of N" in the footer. */
  total: number;
}

/** One flag → its annotation line. Duplicates link to the original bill. */
function renderFlag(flag: BillFlagType) {
  if (flag.type === 'duplicate' && flag.related_bill_id) {
    return (
      <span key={flag.id}>
        {flag.message}{' '}
        <TableAnnotationLink href={`/bills/${flag.related_bill_id}`}>
          View original
        </TableAnnotationLink>
      </span>
    );
  }
  return <span key={flag.id}>{flag.message}</span>;
}

const COLUMNS: TableColumn<BillListItemType>[] = [
  {
    id: 'vendor',
    header: 'Vendor',
    width: 'minmax(220px, 1fr)',
    sticky: 'left',
    // Email-ingested drafts land vendor-less (missing_info) — show a hushed
    // placeholder rather than an empty cell.
    cell: (bill) =>
      bill.vendor_name ? (
        <span className="text-ink">{bill.vendor_name}</span>
      ) : (
        <span className="text-hushed italic">No vendor</span>
      ),
  },
  {
    id: 'invoice_number',
    header: 'Invoice #',
    width: '160px',
    cell: (bill) => bill.invoice_number ?? '—',
  },
  {
    id: 'due_date',
    header: 'Due date',
    width: '140px',
    cell: (bill) => formatBillDate(bill.due_date),
  },
  {
    id: 'status',
    header: 'Status',
    width: '180px',
    cell: (bill) => <StatusPill status={bill.status} />,
  },
  {
    id: 'amount',
    header: 'Amount',
    width: '160px',
    align: 'right',
    sticky: 'right',
    cell: (bill) => <Money cents={bill.amount_cents} currency={bill.currency} />,
  },
];

export function BillsTable({ bills, total }: BillsTableProps) {
  const router = useRouter();
  const totalCents = bills.reduce((sum, bill) => sum + bill.amount_cents, 0);

  return (
    <Table
      data={bills}
      columns={COLUMNS}
      getRowId={(bill) => bill.id}
      selectable
      onRowClick={(bill) => router.push(`/bills/${bill.id}`)}
      getRowAnnotation={(bill) =>
        bill.flags.length > 0 ? (
          <div className="gap-rui-1 flex flex-col">{bill.flags.map(renderFlag)}</div>
        ) : null
      }
      footer={{
        type: 'pagination',
        page: 1,
        pageSize: bills.length || 1,
        totalCount: total,
        noun: 'bills',
        totalCents,
      }}
      className="h-full"
    />
  );
}
