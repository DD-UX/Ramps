import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Avatar } from '../Avatar/Avatar';
import { Button } from '../Button/Button';
import { Money } from '../Money/Money';
import { type BillStatus,StatusPill } from '../StatusPill/StatusPill';
import { Table, TableAnnotationLink, type TableColumn } from './Table';

const meta = {
  title: 'Primitives/Table',
  component: Table,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Table>;

export default meta;

/**
 * Bill record type for the stories (mirrors the real schema shape).
 */
interface Bill {
  id: string;
  vendor: string;
  submitter: string;
  submittedDate: string;
  suggestedAction: 'review_recommended' | 'ready_to_approve';
  status: BillStatus;
  approvalProgress: string; // e.g. "0 of 2 approvals"
  nextApprover: string;
  amountCents: number;
  paymentMethod: string;
  paymentAccount: string;
}

/**
 * **Frame 6 replica** — the "For approval" table from
 * docs/watch-youtube/ramp-bill-pay-series-ap-agent/snapshots/6.jpeg.
 *
 * Columns: Vendor/submitter (with avatar) · Suggested action (green/amber pill) ·
 * Status (approval progress "0 of 2") · Next approver · Amount (right-aligned
 * Money) · Payment method · Payment account · Actions (Approve button).
 *
 * Vetted visual details (1px sampling across all table screens):
 *  - Header: WHITE bg, hushed sentence-case labels, limestone bottom hairline.
 *  - Rows: white bg, limestone dividers, limestone hover, ~56px tall.
 *  - No outer border — the table sits directly on the page canvas.
 *  - Money column: right-aligned, tabular-nums.
 *  - Footer: the REAL pagination band ("Select ⌄" left, "1–7 of 7 bills ·
 *    $634,235.35 total" right, on canvas) — `footer={{ type: 'pagination' }}`.
 *    Both controls are clickable: Select opens the selection-scope menu, the
 *    underlined range opens the page picker (both open upward).
 */
export const Frame6Replica: StoryObj = {
  render: () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        vendor: 'Figma',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'review_recommended',
        status: 'awaiting_approval',
        approvalProgress: '0 of 2 approvals',
        nextApprover: 'Needs your approval',
        amountCents: 150_042_75,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b2',
        vendor: 'Salesforce',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'awaiting_approval',
        approvalProgress: '0 of 2 approvals',
        nextApprover: 'Needs your approval',
        amountCents: 441_726_00,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b3',
        vendor: 'Slack',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'awaiting_approval',
        approvalProgress: '0 of 1 approval',
        nextApprover: 'Needs your approval',
        amountCents: 1_725_00,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b4',
        vendor: 'UPS',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'awaiting_approval',
        approvalProgress: '0 of 1 approval',
        nextApprover: 'Needs your approval',
        amountCents: 49_14,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b5',
        vendor: 'W.B. Mason',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'awaiting_approval',
        approvalProgress: '0 of 2 approvals',
        nextApprover: 'Needs your approval',
        amountCents: 6_442_46,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b6',
        vendor: 'GTI Properties',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'review_recommended',
        status: 'awaiting_approval',
        approvalProgress: '0 of 3 approvals',
        nextApprover: 'Needs your approval',
        amountCents: 22_000_00,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        // 7th bill (the frame shows "1–7 of 7 bills") — amount chosen so the
        // page total lands EXACTLY on the frame's "$634,235.35 total".
        id: 'b7',
        vendor: 'Ramp Cleaning Co.',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'awaiting_approval',
        approvalProgress: '0 of 1 approval',
        nextApprover: 'Needs your approval',
        amountCents: 12_250_00,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
    ];

    const totalCents = bills.reduce((sum, bill) => sum + bill.amountCents, 0);

    const columns: TableColumn<Bill, string>[] = [
      {
        id: 'vendor',
        header: 'Vendor / submitter',
        cell: (row) => (
          <div className="flex items-center gap-rui-2">
            <Avatar name={row.vendor} size="sm" />
            <div className="flex flex-col gap-rui-1">
              <span className="font-heading text-ink">{row.vendor}</span>
              <span className="text-xs text-hushed">
                {row.submitter} · {row.submittedDate}
              </span>
            </div>
          </div>
        ),
        width: '280px',
        sticky: 'left',
      },
      {
        id: 'suggestedAction',
        header: 'Suggested action',
        cell: (row) => (
          <StatusPill
            status={
              row.suggestedAction === 'ready_to_approve'
                ? 'approved'
                : 'missing_info'
            }
          />
        ),
        width: '180px',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <div className="flex items-center gap-rui-1 text-sm text-ink">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-hushed"
            >
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
            </svg>
            {row.approvalProgress}
          </div>
        ),
        width: '150px',
      },
      {
        id: 'nextApprover',
        header: 'Next approver',
        cell: (row) => <span className="text-sm text-ink">{row.nextApprover}</span>,
        width: '180px',
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <Money cents={row.amountCents} />,
        align: 'right',
        width: '140px',
      },
      {
        id: 'paymentMethod',
        header: 'Payment method',
        cell: (row) => (
          <div className="flex items-center gap-rui-1 text-sm text-ink">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="4" width="12" height="8" rx="1" />
            </svg>
            {row.paymentMethod}
          </div>
        ),
        width: '160px',
      },
      {
        id: 'paymentAccount',
        header: 'Payment account',
        cell: (row) => <span className="text-sm text-ink">{row.paymentAccount}</span>,
        width: '180px',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button variant="secondary" size="sm">
            Approve
          </Button>
        ),
        align: 'right',
        width: '120px',
        sticky: 'right',
      },
    ];

    return (
      <Table
        data={bills}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        onRowClick={(row) => console.log('Clicked:', row.vendor)}
        footer={{
          type: 'pagination',
          page: 1,
          pageSize: 7,
          totalCount: 7,
          noun: 'bills',
          totalCents,
        }}
      />
    );
  },
};

/**
 * **Large dataset with virtualization** — 5,000 rows to prove the hand-rolled
 * windowing works. Only ~20 rows render in the DOM at any time; scroll to see
 * the rest materialize. Per the requirement: "Virtual row scrolling to support
 * large datasets (hand-rolled windowing — NO new npm dependencies)."
 */
export const LargeDataset: StoryObj = {
  render: () => {
    const bills: Bill[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `bill-${i}`,
      vendor: `Vendor ${i + 1}`,
      submitter: 'System',
      submittedDate: 'Nov 26, 2025',
      suggestedAction: i % 3 === 0 ? 'review_recommended' : 'ready_to_approve',
      status: 'awaiting_approval',
      approvalProgress: `0 of ${(i % 3) + 1} approvals`,
      nextApprover: 'Needs review',
      amountCents: Math.floor(Math.random() * 100_000),
      paymentMethod: 'ACH',
      paymentAccount: 'Bank (...99)',
    }));

    const columns: TableColumn<Bill, string>[] = [
      {
        id: 'vendor',
        header: 'Vendor',
        cell: (row) => <span className="font-heading text-ink">{row.vendor}</span>,
        width: '200px',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <span className="text-sm text-ink">{row.approvalProgress}</span>,
        width: '150px',
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <Money cents={row.amountCents} />,
        align: 'right',
        width: '140px',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button variant="secondary" size="sm">
            View
          </Button>
        ),
        align: 'right',
        width: '100px',
      },
    ];

    return (
      <div className="space-y-rui-2">
        <p className="text-sm text-hushed">
          5,000 rows — only visible rows render (check DOM: ~20 tbody tr elements)
        </p>
        <Table
          data={bills}
          columns={columns}
          getRowId={(row) => row.id}
          virtualizeAfter={100}
          rowHeight={56}
          overscan={5}
          footer={{
            type: 'custom',
            content: `Total: ${bills.length.toLocaleString()} bills`,
          }}
        />
      </div>
    );
  },
};

/**
 * **Cross-page selection** — selection Map survives pagination. Flip pages via
 * the table's OWN pagination footer (the underlined range opens the page
 * picker — the product has no Previous/Next buttons anywhere in the frames):
 * select rows on page 1, jump to page 2 from the range menu, come back → your
 * selections are still there.
 *
 * Per the video research (frame 11 "0 of 2 approvals", frame 15 multi-select
 * checkboxes): selection is PER-PAGE (select-all checks only the current page),
 * but the selection Map tracks records ACROSS pages so bulk actions can operate
 * on the accumulated set.
 */
export const CrossPageSelection: StoryObj = {
  render: () => {
    const allBills: Bill[] = Array.from({ length: 20 }, (_, i) => ({
      id: `bill-${i}`,
      vendor: `Vendor ${i + 1}`,
      submitter: 'User',
      submittedDate: 'Nov 26, 2025',
      suggestedAction: 'ready_to_approve',
      status: 'awaiting_approval',
      approvalProgress: '0 of 1 approval',
      nextApprover: 'You',
      amountCents: (i + 1) * 1000,
      paymentMethod: 'ACH',
      paymentAccount: 'Bank (...40)',
    }));

    const [page, setPage] = useState(1);
    const [selection, setSelection] = useState<Map<string, Bill>>(new Map());
    const pageSize = 5;
    const pageData = allBills.slice((page - 1) * pageSize, page * pageSize);
    const totalCents = allBills.reduce((sum, bill) => sum + bill.amountCents, 0);

    const columns: TableColumn<Bill, string>[] = [
      {
        id: 'vendor',
        header: 'Vendor',
        cell: (row) => <span className="font-heading text-ink">{row.vendor}</span>,
        width: '200px',
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <Money cents={row.amountCents} />,
        align: 'right',
        width: '140px',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button variant="secondary" size="sm">
            Approve
          </Button>
        ),
        align: 'right',
        width: '100px',
      },
    ];

    return (
      <div className="space-y-rui-4">
        <div className="text-sm text-hushed">
          <strong>Instructions:</strong> Select rows on page 1, jump to another
          page from the underlined range in the footer, come back → your
          selections persist.
        </div>
        <Table
          data={pageData}
          columns={columns}
          getRowId={(row) => row.id}
          selectable
          selectedRows={selection}
          onSelectionChange={setSelection}
          footer={{
            type: 'pagination',
            page,
            pageSize,
            totalCount: allBills.length,
            noun: 'bills',
            totalCents,
            onPageChange: setPage,
          }}
        />
        <div className="text-sm text-ink">
          <strong>{selection.size}</strong> selected across all pages
        </div>
      </div>
    );
  },
};

/**
 * **Summary footer (per-column totals)** — `footer={{ type: 'summary' }}` with
 * a money total on the Amount column that tracks the SELECTED rows: $0.00
 * with nothing selected, live sum as rows are checked. This is the per-column
 * tfoot kind (the pagination band above is the product's list-screen footer).
 */
export const SummaryFooter: StoryObj = {
  render: () => {
    const bills: Bill[] = Array.from({ length: 4 }, (_, i) => ({
      id: `bill-${i}`,
      vendor: `Vendor ${i + 1}`,
      submitter: 'User',
      submittedDate: 'Nov 26, 2025',
      suggestedAction: 'ready_to_approve',
      status: 'awaiting_approval',
      approvalProgress: '0 of 1 approval',
      nextApprover: 'You',
      amountCents: (i + 1) * 1000,
      paymentMethod: 'ACH',
      paymentAccount: 'Bank (...40)',
    }));

    const [selection, setSelection] = useState<Map<string, Bill>>(new Map());

    const columns: TableColumn<Bill, string>[] = [
      {
        id: 'vendor',
        header: 'Vendor',
        cell: (row) => <span className="font-heading text-ink">{row.vendor}</span>,
        width: '200px',
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <Money cents={row.amountCents} />,
        align: 'right',
        width: '140px',
        footer: {
          type: 'money',
          cents: Array.from(selection.values()).reduce(
            (sum, bill) => sum + bill.amountCents,
            0,
          ),
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button variant="secondary" size="sm">
            Approve
          </Button>
        ),
        align: 'right',
        width: '100px',
      },
    ];

    return (
      <Table
        data={bills}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        selectedRows={selection}
        onSelectionChange={setSelection}
        footer={{ type: 'summary' }}
      />
    );
  },
};

/**
 * **Sticky first + last columns with horizontal scroll** — proves the sticky
 * positioning works. Many middle columns force X scroll; the first data column
 * (Vendor) and last column (Actions) stay pinned while the middle scrolls.
 *
 * Per the requirement: "The LAST column and the FIRST data column (first after
 * the checkbox column) must support being sticky while the middle columns scroll
 * horizontally."
 */
export const StickyColumns: StoryObj = {
  render: () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        vendor: 'Figma',
        submitter: 'Elizabeth Smith',
        submittedDate: 'Nov 26, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'approved',
        approvalProgress: '2 of 2 approvals',
        nextApprover: 'Complete',
        amountCents: 4500,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank',
      },
      {
        id: 'b2',
        vendor: 'Salesforce',
        submitter: 'John Doe',
        submittedDate: 'Nov 25, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'scheduled',
        approvalProgress: '1 of 1 approval',
        nextApprover: 'Complete',
        amountCents: 131_845,
        paymentMethod: 'Wire',
        paymentAccount: 'Thread Bank',
      },
    ];

    const columns: TableColumn<Bill, string>[] = [
      {
        id: 'vendor',
        header: 'Vendor',
        cell: (row) => (
          <div className="flex items-center gap-rui-2">
            <Avatar name={row.vendor} size="sm" />
            <span className="font-heading text-ink">{row.vendor}</span>
          </div>
        ),
        width: '200px',
        sticky: 'left',
      },
      {
        id: 'submitter',
        header: 'Submitter',
        cell: (row) => <span className="text-sm text-ink">{row.submitter}</span>,
        width: '180px',
      },
      {
        id: 'submittedDate',
        header: 'Submitted',
        cell: (row) => <span className="text-sm text-hushed">{row.submittedDate}</span>,
        width: '150px',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusPill status={row.status} />,
        width: '150px',
      },
      {
        id: 'approvalProgress',
        header: 'Approvals',
        cell: (row) => <span className="text-sm text-ink">{row.approvalProgress}</span>,
        width: '150px',
      },
      {
        id: 'nextApprover',
        header: 'Next approver',
        cell: (row) => <span className="text-sm text-hushed">{row.nextApprover}</span>,
        width: '150px',
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <Money cents={row.amountCents} />,
        align: 'right',
        width: '140px',
      },
      {
        id: 'paymentMethod',
        header: 'Method',
        cell: (row) => <span className="text-sm text-ink">{row.paymentMethod}</span>,
        width: '120px',
      },
      {
        id: 'paymentAccount',
        header: 'Account',
        cell: (row) => <span className="text-sm text-ink">{row.paymentAccount}</span>,
        width: '150px',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button variant="secondary" size="sm">
            Pay
          </Button>
        ),
        align: 'right',
        width: '100px',
        sticky: 'right',
      },
    ];

    return (
      <div className="space-y-rui-2">
        <p className="text-sm text-hushed">
          Scroll horizontally → Vendor (first) and Actions (last) columns stay pinned
        </p>
        <Table
          data={bills}
          columns={columns}
          getRowId={(row) => row.id}
          selectable
        />
      </div>
    );
  },
};

/**
 * **Pagination footer** — the "1–3 of 3 bills · $1,194.08 total" band from
 * does-ramp/17, now the real `footer={{ type: 'pagination' }}`: "Select ⌄"
 * on the left, the clickable underlined range + hushed meta on the right,
 * all on the canvas band. (The free-form `custom` footer kind is exercised
 * by the LargeDataset story.)
 */
export const PaginationFooter: StoryObj = {
  render: () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        vendor: 'Berroco, Inc.',
        submitter: 'Hannah Smolinski',
        submittedDate: 'Feb 22, 2026',
        suggestedAction: 'ready_to_approve',
        status: 'scheduled',
        approvalProgress: 'Payment details needed',
        nextApprover: 'N/A',
        amountCents: 825_00,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b2',
        vendor: 'Ziply Fiber',
        submitter: 'Hannah Smolinski',
        submittedDate: 'Feb 22, 2026',
        suggestedAction: 'ready_to_approve',
        status: 'scheduled',
        approvalProgress: 'Payment details needed',
        nextApprover: 'N/A',
        amountCents: 106_58,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b3',
        vendor: 'Clarity Online',
        submitter: 'Hannah Smolinski',
        submittedDate: 'Feb 22, 2026',
        suggestedAction: 'ready_to_approve',
        status: 'scheduled',
        approvalProgress: 'Payment details needed',
        nextApprover: 'N/A',
        amountCents: 262_50,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
    ];

    const totalCents = bills.reduce((sum, bill) => sum + bill.amountCents, 0);

    const columns: TableColumn<Bill, string>[] = [
      {
        id: 'vendor',
        header: 'Vendor / submitter',
        cell: (row) => (
          <div className="flex items-center gap-rui-2">
            <Avatar name={row.vendor} size="sm" />
            <div className="flex flex-col gap-rui-1">
              <span className="font-heading text-ink">{row.vendor}</span>
              <span className="text-xs text-hushed">
                {row.submitter} · {row.submittedDate}
              </span>
            </div>
          </div>
        ),
        width: '300px',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusPill status={row.status} />,
        width: '150px',
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <Money cents={row.amountCents} />,
        align: 'right',
        width: '140px',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button variant="secondary" size="sm">
            Review
          </Button>
        ),
        align: 'right',
        width: '100px',
      },
    ];

    return (
      <Table
        data={bills}
        columns={columns}
        getRowId={(row) => row.id}
        footer={{
          type: 'pagination',
          page: 1,
          pageSize: 3,
          totalCount: 3,
          noun: 'bills',
          totalCents,
        }}
      />
    );
  },
};

/**
 * **Flagged bills with annotations** — per-row callout lines for fraud alerts,
 * duplicate warnings, and overbilling notices. Vetted from video frames:
 * - "Ramp identified $5,660.00 of overbilling for this invoice" (full-line link)
 * - "This draft may be a duplicate of INV# 8960. Make sure you're not paying twice."
 *   (only "INV# 8960" linked)
 *
 * Treatment (re-vetted on product-overview 01/02): ↳ hook glyph
 * (CornerDownRight icon) + alert CRIMSON text (#8f1f1f — max-red-saturation
 * scan of the glyph junctions) on the full-width rose wash band
 * (--rui-alert-surface #fcf8f4), indented to start under the first data
 * column, no hover wash.
 */
export const FlaggedBills: StoryObj = {
  render: () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        vendor: 'Amazon',
        submitter: 'David Wallace',
        submittedDate: 'Sep 12, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'awaiting_approval',
        approvalProgress: '0 of 2 approvals',
        nextApprover: 'Needs your approval',
        amountCents: 3_514_92,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b2',
        vendor: 'Cisco Systems',
        submitter: 'David Wallace',
        submittedDate: 'Sep 12, 2025',
        suggestedAction: 'review_recommended',
        status: 'awaiting_approval',
        approvalProgress: '0 of 2 approvals',
        nextApprover: 'Needs your approval',
        amountCents: 198_380_00,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
      {
        id: 'b3',
        vendor: 'Staples',
        submitter: 'David Wallace',
        submittedDate: 'Sep 12, 2025',
        suggestedAction: 'ready_to_approve',
        status: 'awaiting_approval',
        approvalProgress: '0 of 1 approval',
        nextApprover: 'Needs your approval',
        amountCents: 3_010_48,
        paymentMethod: 'ACH',
        paymentAccount: 'Thread Bank (...40)',
      },
    ];

    const columns: TableColumn<Bill, string>[] = [
      {
        id: 'vendor',
        header: 'Vendor / submitter',
        cell: (row) => (
          <div className="flex items-center gap-rui-2">
            <Avatar name={row.vendor} size="sm" />
            <div className="flex flex-col gap-rui-1">
              <span className="font-heading text-ink">{row.vendor}</span>
              <span className="text-xs text-hushed">
                {row.submitter} · {row.submittedDate}
              </span>
            </div>
          </div>
        ),
        width: '280px',
        sticky: 'left',
      },
      {
        id: 'suggestedAction',
        header: 'Suggested action',
        cell: (row) => (
          <StatusPill
            status={
              row.suggestedAction === 'ready_to_approve'
                ? 'approved'
                : 'missing_info'
            }
          />
        ),
        width: '180px',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <div className="flex items-center gap-rui-1 text-sm text-ink">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-hushed"
            >
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
            </svg>
            {row.approvalProgress}
          </div>
        ),
        width: '150px',
      },
      {
        id: 'nextApprover',
        header: 'Next approver',
        cell: (row) => <span className="text-sm text-ink">{row.nextApprover}</span>,
        width: '180px',
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => <Money cents={row.amountCents} />,
        align: 'right',
        width: '140px',
      },
      {
        id: 'paymentMethod',
        header: 'Payment method',
        cell: (row) => (
          <div className="flex items-center gap-rui-1 text-sm text-ink">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="4" width="12" height="8" rx="1" />
            </svg>
            {row.paymentMethod}
          </div>
        ),
        width: '160px',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button variant="secondary" size="sm">
            Review
          </Button>
        ),
        align: 'right',
        width: '100px',
        sticky: 'right',
      },
    ];

    return (
      <div className="space-y-rui-2">
        <p className="text-sm text-hushed">
          Annotation rows show fraud alerts, duplicate warnings, and overbilling
          notices beneath flagged bills
        </p>
        <Table
          data={bills}
          columns={columns}
          getRowId={(row) => row.id}
          selectable
          getRowAnnotation={(row) => {
            if (row.id === 'b2') {
              // Cisco Systems: full-line link
              return (
                <TableAnnotationLink href="#overbilling">
                  Ramp identified $5,660.00 of overbilling for this invoice
                </TableAnnotationLink>
              );
            }
            if (row.id === 'b3') {
              // Staples: partial link
              return (
                <>
                  This draft may be a duplicate of{' '}
                  <TableAnnotationLink href="#invoice-8960">
                    INV# 8960
                  </TableAnnotationLink>
                  . Make sure you're not paying twice.
                </>
              );
            }
            return null;
          }}
          onRowClick={(row) => console.log('Clicked:', row.vendor)}
        />
      </div>
    );
  },
};
