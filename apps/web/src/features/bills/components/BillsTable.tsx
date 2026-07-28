'use client';

import type { BillFlagType, BillListItemType } from '@ramps/schemas/bills';
import { Money } from '@ramps/ui/Money';
import { StatusPill } from '@ramps/ui/StatusPill';
import { Table, TableAnnotationLink, type TableColumn } from '@ramps/ui/Table';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { useUrlNavigation } from '@/features/common/context/UrlNavigation.context';
import { isTypingOrDialog } from '@/features/common/hooks/useUpDownNavigation';

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
 * Status pill, Amount (sticky-right, right-aligned tabular money). The footer
 * is the vetted pagination band: the rows ARE the server's window (the caller
 * fetches exactly `page`/`pageSize` of the category), and the band's page
 * picker and Prev/Next steps navigate `?page=` (preserving the tab and
 * search) — a shallow URL update whose re-keyed fetch brings the next window.
 * The physical ←/→ keys drive the same Prev/Next (binding below).
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
    //
    // `role="presentation"` is the accurate description AND what unblocks a11y
    // linting: the div is a pure event barrier with no semantics and nothing
    // focusable of its own. It deliberately carries NO keyboard handler — the
    // row activates on click only (Table wires `onRowClick`, never a key
    // listener), so there is no keyboard path to intercept. Pairing a fake
    // onKeyDown with it would be dead code written to appease a rule.
    cell: (bill) =>
      hasBillActions(bill.status) ? (
        <div role="presentation" onClick={(event) => event.stopPropagation()}>
          <BillsActionsMenu bill={bill} />
        </div>
      ) : null,
  },
];

export function BillsTable({ bills, total, page, pageSize }: BillsTableProps) {
  // `router` is kept for the ROW click alone: opening a bill is a real route
  // change, so Next's own `loading.tsx` boundary covers it. The pager is URL
  // state on THIS route, where that boundary never fires — hence the shared
  // transition below.
  const router = useRouter();
  const { navigate, pathname, search } = useUrlNavigation();
  // Sum of the rows on THIS page — the footer shows the subtotal for the visible
  // window ("1–10 of N · $… total"), alongside the range it belongs to.
  const totalCents = bills.reduce((sum, bill) => sum + bill.amount_cents, 0);

  // Flip pages by navigating `?page=` (preserving `?tab=` / `?q=`), so the page
  // is shareable URL state like the tab and search — the provider's transport
  // (shallow here) carries it; page 1 drops the param. buildPageQuery owns the math.
  const onPageChange = useCallback(
    (next: number) => {
      const query = buildPageQuery(search, next);
      navigate(query ? `${pathname}?${query}` : pathname);
    },
    [navigate, pathname, search],
  );

  // ←/→, document-wide — the pagination twin of the detail screen's category
  // chevrons: the horizontal arrows walk the horizontal axis (pages here,
  // categories there), one binding per surface since the two never co-mount.
  // A keypress CLICKS the footer's own real Prev/Next button, so keyboard and
  // mouse are one code path — and the clamp is free: at an edge the band
  // renders the faded step with NO button, so the key finds nothing to press.
  // The shared `isTypingOrDialog` gate keeps ←/→ away from fields (the search
  // box owns its caret) and open dialogs.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (isTypingOrDialog(event.target)) return;
      const button = document.querySelector<HTMLButtonElement>(
        `button[data-table-pager="${event.key === 'ArrowLeft' ? 'prev' : 'next'}"]`,
      );
      if (!button) return; // at an edge — the key has no page to flip to
      event.preventDefault();
      button.click();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

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
