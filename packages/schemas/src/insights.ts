import { z } from 'zod';

import { BillStatusSchema } from './bills.js';
import { CurrencyCodeSchema, IdSchema, IsoDateSchema, MoneyCentsSchema } from './primitives.js';

/**
 * Insights — the aggregate read behind `/insights`.
 *
 * The Bill Pay table answers "which bill?"; this answers "how much, and how is
 * it moving?". It is a SEPARATE server-side aggregate rather than a reduction
 * over the table's SWR cache, because that cache only ever holds the current
 * tab's current page — a chart drawn from it would be a chart of whatever
 * happened to be on screen, which is exactly the kind of half-truth the rest of
 * this build has been removing.
 *
 * Every figure here is denominated in CENTS and in ONE currency (the corpus is
 * single-currency; {@link InsightsSummarySchema.currency} states which, so a
 * future multi-currency corpus fails loudly at the boundary rather than
 * silently adding dollars to euros).
 */

/**
 * A count-and-money pair — the shape every headline figure takes. Bills are
 * counted AND totalled everywhere, because either alone misleads: "12 bills"
 * hides a $2M outlier, "$2M" hides that it's one invoice.
 */
export const InsightsBucketSchema = z.object({
  count: z.number().int().nonnegative(),
  amount_cents: MoneyCentsSchema,
});
export type InsightsBucketType = z.infer<typeof InsightsBucketSchema>;

/**
 * One lifecycle state's share of the table — the data behind the pipeline
 * breakdown. Unlike the spend series below, this is a CENSUS: every state
 * appears, `rejected` and `archived` included, because "how much did we throw
 * out" is itself an insight.
 */
export const InsightsStatusTotalSchema = InsightsBucketSchema.extend({
  status: BillStatusSchema,
});
export type InsightsStatusTotalType = z.infer<typeof InsightsStatusTotalSchema>;

/** `YYYY-MM` — a due-date month bucket. Pinned so a stray `YYYY-M` 400s. */
export const InsightsMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
  message: 'Expected a YYYY-MM month bucket',
});
export type InsightsMonthType = z.infer<typeof InsightsMonthSchema>;

/**
 * One month of spend, split by whether the money has actually moved.
 *
 * `paid_cents + outstanding_cents === amount_cents` by construction, so the
 * stacked bar can't drift from its own total. A `partially_paid` bill counts as
 * outstanding IN FULL: splitting it would need the payment rows, and inventing
 * a split we can't source would overstate what this read knows.
 */
export const InsightsMonthTotalSchema = InsightsBucketSchema.extend({
  month: InsightsMonthSchema,
  /** Settled — bills sitting on `paid`. */
  paid_cents: MoneyCentsSchema,
  /** Still owed — everything else in the month, `partially_paid` included. */
  outstanding_cents: MoneyCentsSchema,
});
export type InsightsMonthTotalType = z.infer<typeof InsightsMonthTotalSchema>;

/**
 * One GL account's share of spend.
 *
 * `id`/`code` are null for the synthetic UNCODED bucket, which carries both the
 * lines with no GL account AND each bill's residual (header total minus the sum
 * of its lines — a bill may be only partly coded). Folding the residual in is
 * what lets these slices sum to the active spend total exactly, so a share-of-
 * total chart is a true 100% rather than a percentage of whatever happened to
 * be coded.
 */
export const InsightsCategoryTotalSchema = z.object({
  id: IdSchema.nullable(),
  /** The GL account number, e.g. `6030`. Null on the uncoded bucket. */
  code: z.string().nullable(),
  /** Always present — the uncoded bucket carries a human label, not a blank. */
  name: z.string().min(1),
  amount_cents: MoneyCentsSchema,
});
export type InsightsCategoryTotalType = z.infer<typeof InsightsCategoryTotalSchema>;

/**
 * One vendor's share of spend. `id` is null for the synthetic bucket holding
 * vendor-less bills — the email door lands `missing_info` drafts before anyone
 * has matched a vendor, and dropping them would quietly shrink the total.
 */
export const InsightsVendorTotalSchema = InsightsBucketSchema.extend({
  id: IdSchema.nullable(),
  name: z.string().min(1),
});
export type InsightsVendorTotalType = z.infer<typeof InsightsVendorTotalSchema>;

/**
 * The whole `/insights` payload — four headline buckets and four series.
 *
 * The buckets nest, widest first: `all` ⊇ `active` ⊇ `open` ⊇ {`overdue`,
 * `undated`}. Each is named for the question it answers rather than for the
 * status list behind it, and the list behind it lives in one place in the SDK
 * so a new status can't silently fall out of a chart.
 */
export const InsightsSummarySchema = z.object({
  /**
   * The server's date when the aggregate ran. "Overdue" is relative to a day,
   * and the client's clock is not the one that decided — so the answer travels
   * with the date it was computed against.
   */
  as_of: IsoDateSchema,
  currency: CurrencyCodeSchema,

  /** Every bill in the table, no exceptions. The census total. */
  all: InsightsBucketSchema,
  /** Money that can still move: everything but `rejected` and `archived`. */
  active: InsightsBucketSchema,
  /** Active and not yet settled — the true payables balance. */
  open: InsightsBucketSchema,
  /** Open with a due date already past `as_of`. The number that hurts. */
  overdue: InsightsBucketSchema,
  /** Open with NO due date — unschedulable, and therefore invisible on the
   *  month series. Surfaced so the chart's shortfall is accounted for. */
  undated: InsightsBucketSchema,

  /** Census by lifecycle state, every state present, biggest count first. */
  by_status: z.array(InsightsStatusTotalSchema),
  /**
   * Active spend by due month, CONTIGUOUS from the first to the last month
   * with a bill — an empty month is a zero row, not a missing one, so the time
   * axis is evenly spaced instead of compressing a quiet quarter.
   */
  by_month: z.array(InsightsMonthTotalSchema),
  /** Active spend by GL account, largest first, uncoded residual folded in. */
  by_category: z.array(InsightsCategoryTotalSchema),
  /** Active spend by vendor, largest first. The UI takes the top few. */
  by_vendor: z.array(InsightsVendorTotalSchema),
});
export type InsightsSummaryType = z.infer<typeof InsightsSummarySchema>;

/** The `/api/insights` response envelope, matching the `{ bills }` house style. */
export const InsightsResponseSchema = z.object({
  insights: InsightsSummarySchema,
});
export type InsightsResponseType = z.infer<typeof InsightsResponseSchema>;
