import type { BillStatusType } from '@ramps/schemas/bills';
import {
  type InsightsBucketType,
  type InsightsCategoryTotalType,
  type InsightsMonthTotalType,
  type InsightsStatusTotalType,
  InsightsSummarySchema,
  type InsightsSummaryType,
  type InsightsVendorTotalType,
} from '@ramps/schemas/insights';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk insights facade — the aggregate behind `/insights`.
 *
 * PostgREST has no GROUP BY, so this does what `countBillsByStatus` already
 * does one size up: pull the NARROW columns the aggregate needs (no joins to
 * the detail, no flags, no documents) and fold them in memory. Two round-trips
 * — the bill headers and the coded lines — plus two tiny label tables.
 *
 * That is a deliberate trade, not an oversight. At this corpus (tens of bills)
 * it's free, and it keeps the whole definition of "spend", "open" and "overdue"
 * in ONE readable place instead of split across a materialized view and a
 * migration. At a real corpus this becomes a database view or an RPC; the
 * function's signature and its parsed return would not change, which is the
 * point of putting it behind a facade at all.
 *
 * Every figure is validated against {@link InsightsSummarySchema} before it
 * leaves — same boundary rule as the list read.
 */

/**
 * Bills whose money will never move. Excluded from every SPEND figure (`active`
 * and the three series), but still present in `by_status`, which is a census of
 * the table rather than a view of spend.
 */
const DEAD_STATUSES: readonly BillStatusType[] = ['rejected', 'archived'];

/**
 * Bills that have fully settled. `partially_paid` is deliberately NOT here: the
 * paid fraction lives on the payment rows, and this read doesn't fetch them, so
 * counting the whole bill as settled would overstate what it knows. It stays
 * OPEN, in full — an overstatement of what's owed is the safer error.
 */
const SETTLED_STATUSES: readonly BillStatusType[] = ['paid'];

/** The label the vendor-less bucket carries — the email door's unmatched drafts. */
export const INSIGHTS_NO_VENDOR_LABEL = 'No vendor yet';

/** The label the uncoded bucket carries in {@link InsightsSummaryType.by_category}. */
export const INSIGHTS_UNCODED_LABEL = 'Uncoded';

/** The narrow bill projection the aggregate folds. No joins, no documents. */
interface InsightsBillRow {
  id: string;
  vendor_id: string | null;
  due_date: string | null;
  amount_cents: number;
  currency: string;
  status: BillStatusType;
}

/** The narrow line projection — enough to attribute spend to a GL account. */
interface InsightsLineRow {
  bill_id: string;
  gl_account_id: string | null;
  amount_cents: number;
}

/** A mutable accumulator; frozen into an {@link InsightsBucketType} at the end. */
interface Tally {
  count: number;
  amount_cents: number;
}

function emptyTally(): Tally {
  return { count: 0, amount_cents: 0 };
}

function add(tally: Tally, cents: number): void {
  tally.count += 1;
  tally.amount_cents += cents;
}

function bucket(tally: Tally): InsightsBucketType {
  return { count: tally.count, amount_cents: tally.amount_cents };
}

/** `YYYY-MM` from an ISO `YYYY-MM-DD`. Slicing beats parsing: no timezone to get wrong. */
function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/**
 * Every month from `first` to `last` inclusive, as `YYYY-MM`. A quiet month has
 * to appear as a ZERO row rather than vanish, or the chart's x-axis silently
 * compresses time and a gap reads as a decline.
 */
function monthRange(first: string, last: string): string[] {
  const months: string[] = [];
  let year = Number(first.slice(0, 4));
  let month = Number(first.slice(5, 7));
  const endYear = Number(last.slice(0, 4));
  const endMonth = Number(last.slice(5, 7));

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/**
 * Build the `/insights` aggregate over the WHOLE bills table.
 *
 * Deliberately unfiltered and unpaginated: the point of the surface is the
 * shape of everything, which is the one question the paginated table can't
 * answer. Returns a parsed {@link InsightsSummaryType}.
 */
export async function getBillInsights(supabase: ServerSupabase): Promise<InsightsSummaryType> {
  const [billsResult, linesResult, vendorsResult, accountsResult] = await Promise.all([
    supabase.from('bills').select('id, vendor_id, due_date, amount_cents, currency, status'),
    supabase.from('bill_line_items').select('bill_id, gl_account_id, amount_cents'),
    supabase.from('vendors').select('id, name'),
    supabase.from('gl_accounts').select('id, code, name'),
  ]);

  for (const result of [billsResult, linesResult, vendorsResult, accountsResult]) {
    if (result.error) throw toSdkError(result.error);
  }

  const bills = (billsResult.data ?? []) as unknown as InsightsBillRow[];
  const lines = (linesResult.data ?? []) as unknown as InsightsLineRow[];
  const vendorNames = new Map(
    ((vendorsResult.data ?? []) as unknown as { id: string; name: string }[]).map((v) => [
      v.id,
      v.name,
    ]),
  );
  const accounts = new Map(
    (
      (accountsResult.data ?? []) as unknown as { id: string; code: string; name: string }[]
    ).map((a) => [a.id, a]),
  );

  // The server's day is the one that decides what's overdue, and it travels
  // with the answer so the client never re-decides against its own clock.
  const asOf = new Date().toISOString().slice(0, 10);

  const all = emptyTally();
  const active = emptyTally();
  const open = emptyTally();
  const overdue = emptyTally();
  const undated = emptyTally();

  const byStatus = new Map<BillStatusType, Tally>();
  const byMonth = new Map<string, { total: Tally; paid_cents: number }>();
  const byVendor = new Map<string | null, Tally>();
  /** bill id → whether it counts as spend, so the line pass can reuse the verdict. */
  const activeBills = new Map<string, InsightsBillRow>();

  for (const bill of bills) {
    add(all, bill.amount_cents);

    const statusTally = byStatus.get(bill.status) ?? emptyTally();
    add(statusTally, bill.amount_cents);
    byStatus.set(bill.status, statusTally);

    if (DEAD_STATUSES.includes(bill.status)) continue;
    add(active, bill.amount_cents);
    activeBills.set(bill.id, bill);

    const vendorTally = byVendor.get(bill.vendor_id) ?? emptyTally();
    add(vendorTally, bill.amount_cents);
    byVendor.set(bill.vendor_id, vendorTally);

    const settled = SETTLED_STATUSES.includes(bill.status);
    if (!settled) {
      add(open, bill.amount_cents);
      if (!bill.due_date) add(undated, bill.amount_cents);
      else if (bill.due_date < asOf) add(overdue, bill.amount_cents);
    }

    // Undated bills can't sit on a timeline; `undated` above is where they're
    // accounted for, so the month series never invents a bucket for them.
    if (!bill.due_date) continue;
    const key = monthOf(bill.due_date);
    const month = byMonth.get(key) ?? { total: emptyTally(), paid_cents: 0 };
    add(month.total, bill.amount_cents);
    if (settled) month.paid_cents += bill.amount_cents;
    byMonth.set(key, month);
  }

  // Coded spend, by GL account. Only lines belonging to an ACTIVE bill count —
  // the same exclusion the money figures use, applied one level down.
  const byCategory = new Map<string | null, number>();
  const codedPerBill = new Map<string, number>();
  for (const line of lines) {
    if (!activeBills.has(line.bill_id)) continue;
    byCategory.set(line.gl_account_id, (byCategory.get(line.gl_account_id) ?? 0) + line.amount_cents);
    codedPerBill.set(line.bill_id, (codedPerBill.get(line.bill_id) ?? 0) + line.amount_cents);
  }

  // Fold each bill's RESIDUAL (header total minus the sum of its lines) into
  // the uncoded bucket, so the categories sum to `active` exactly and a
  // share-of-total chart is a true 100% rather than a share of what happened to
  // be coded. Clamped at zero: an over-coded bill is a data error, and negative
  // spend would render as a slice pointing the wrong way.
  for (const [id, bill] of activeBills) {
    const residual = bill.amount_cents - (codedPerBill.get(id) ?? 0);
    if (residual > 0) byCategory.set(null, (byCategory.get(null) ?? 0) + residual);
  }

  const statusTotals: InsightsStatusTotalType[] = [...byStatus.entries()]
    .map(([status, tally]) => ({ status, ...bucket(tally) }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

  const monthKeys = [...byMonth.keys()].sort();
  const first = monthKeys[0];
  const last = monthKeys[monthKeys.length - 1];
  const monthTotals: InsightsMonthTotalType[] =
    first && last
      ? monthRange(first, last).map((month) => {
          const entry = byMonth.get(month);
          const total = entry?.total ?? emptyTally();
          const paid = entry?.paid_cents ?? 0;
          return {
            month,
            ...bucket(total),
            paid_cents: paid,
            outstanding_cents: total.amount_cents - paid,
          };
        })
      : [];

  const categoryTotals: InsightsCategoryTotalType[] = [...byCategory.entries()]
    .map(([id, amount_cents]) => {
      const account = id ? accounts.get(id) : undefined;
      return {
        id: account ? account.id : null,
        code: account?.code ?? null,
        name: account?.name ?? INSIGHTS_UNCODED_LABEL,
        amount_cents,
      };
    })
    .sort((a, b) => b.amount_cents - a.amount_cents || a.name.localeCompare(b.name));

  const vendorTotals: InsightsVendorTotalType[] = [...byVendor.entries()]
    .map(([id, tally]) => ({
      id,
      name: (id ? vendorNames.get(id) : null) ?? INSIGHTS_NO_VENDOR_LABEL,
      ...bucket(tally),
    }))
    .sort((a, b) => b.amount_cents - a.amount_cents || a.name.localeCompare(b.name));

  // One corpus, one currency — take it from the data rather than hardcoding it,
  // and let the schema reject anything that isn't a currency code.
  const currency = bills[0]?.currency ?? 'USD';

  return InsightsSummarySchema.parse({
    as_of: asOf,
    currency,
    all: bucket(all),
    active: bucket(active),
    open: bucket(open),
    overdue: bucket(overdue),
    undated: bucket(undated),
    by_status: statusTotals,
    by_month: monthTotals,
    by_category: categoryTotals,
    by_vendor: vendorTotals,
  });
}
