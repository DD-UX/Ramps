'use client';

import type { BillFlagType, BillListItemType } from '@ramps/schemas/bills';
import { Money } from '@ramps/ui/Money';
import { StatusPill } from '@ramps/ui/StatusPill';
import { Table, TableAnnotationLink, type TableColumn } from '@ramps/ui/Table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { hasBillActions } from '../constants/bill-actions.constants';
import { formatBillDate } from '../helpers/format-date.helpers';
import { buildPageQuery } from '../helpers/page-query.helpers';
import { BillsActionsMenu } from './BillsActionsMenu';

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
 * the vetted pagination band: the server windows the query to `page`/`pageSize`,
 * and the band's page picker navigates `?page=` (preserving the tab and search),
 * re-running the Server Component for the next window.
 */
export interface BillsTableProps {
  bills: BillListItemType[];
  /** Total rows for the active tab — the "of N" in the footer. */
  total: number;
  /** The active 1-based page — the footer's range start and picker highlight. */
  page: number;
  /** Rows per page — with `total`, the footer derives the page count + range. */
  pageSize: number;
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
    cell: (bill) => <Money cents={bill.amount_cents} currency={bill.currency} />,
  },
  {
    id: 'actions',
    // Header-less: the overflow column is an affordance gutter, not a data field
    // — the frames leave it unlabelled.
    header: '',
    width: '64px',
    align: 'right',
    // NOT sticky: a per-cell `sticky` <td> forms its own stacking context, which
    // trapped the open menu panel BEHIND lower rows' cells (a later-DOM sticky
    // cell painted over an upper row's popover). The overflow gutter rides with
    // the body scroll so the panel can layer cleanly above the rows.
    // Only actionable rows carry the kebab — a `rejected`/`archived`/mid-payment
    // bill has no move, so its cell stays blank rather than showing an inert
    // three-dot. The wrapper swallows its own clicks so opening the menu (or
    // firing an action) never triggers the row's navigate-to-detail — the same
    // guard the checkbox cell uses.
    cell: (bill) =>
      hasBillActions(bill.status) ? (
        <div onClick={(event) => event.stopPropagation()}>
          <BillsActionsMenu bill={bill} />
        </div>
      ) : null,
  },
];

export function BillsTable({ bills, total, page, pageSize }: BillsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Sum of the rows on THIS page — the footer shows the subtotal for the visible
  // window ("1–10 of N · $… total"), alongside the range it belongs to.
  const totalCents = bills.reduce((sum, bill) => sum + bill.amount_cents, 0);

  // Flip pages by navigating `?page=` (preserving `?tab=` / `?q=`), so the page
  // is shareable URL state like the tab and search — the Server Component
  // re-queries the window; page 1 drops the param. buildPageQuery owns the math.
  const onPageChange = useCallback(
    (next: number) => {
      const query = buildPageQuery(searchParams.toString(), next);
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams],
  );

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
        page,
        pageSize,
        totalCount: total,
        noun: 'bills',
        totalCents,
        onPageChange,
      }}
      className="h-full"
    />
  );
}
