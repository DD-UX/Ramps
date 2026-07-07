import type { VendorReviewStateType } from '@ramps/schemas/vendors';

/**
 * The Vendors tab catalog (design snapshot `01-vendors-overview-tab`):
 * Overview · Needs review · Renewals · Duplicates · Switch cards.
 *
 * Bills drive their tabs from the `bill_tabs` DB lookup because the product
 * lets users author custom saved views. Vendors have no such catalog table, so
 * the fixed workflow tabs live here as a constant — but they are FUNCTIONAL,
 * not decorative: each non-Overview tab maps to a `vendor_review_state` bucket
 * and filters the real query. No seeded vendor currently sits in a workflow
 * bucket, so those tabs render empty until data lands (by design).
 *
 * `reviewStates: []` on "Overview" reads as "no filter" (the whole table),
 * matching the bills convention where the default tab's empty group is the
 * grand total. No count badges — the design shows none for the empty buckets.
 */
export interface VendorTab {
  /** URL-safe slug used as the `?tab=` param. */
  code: string;
  /** Human label rendered in the tab bar. */
  name: string;
  /** The review-state buckets this tab rolls up. Empty = no filter (Overview). */
  reviewStates: readonly VendorReviewStateType[];
}

export const VENDOR_TABS: readonly VendorTab[] = [
  { code: 'overview', name: 'Overview', reviewStates: [] },
  { code: 'needs-review', name: 'Needs review', reviewStates: ['needs_review'] },
  { code: 'renewals', name: 'Renewals', reviewStates: ['renewal'] },
  { code: 'duplicates', name: 'Duplicates', reviewStates: ['duplicate'] },
  { code: 'switch-cards', name: 'Switch cards', reviewStates: ['switch_card'] },
];
