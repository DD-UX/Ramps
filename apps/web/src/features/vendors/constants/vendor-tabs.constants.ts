import type { VendorStatusType } from '@ramps/schemas/vendors';

/**
 * The Vendors tab catalog.
 *
 * Bills drive their tabs from the `bill_tabs` DB lookup because the product
 * lets users author custom saved views. Vendors have no such catalog table, so
 * their far simpler grouping — All · Active · Inactive — lives here as a
 * constant. Same SHAPE as a `BillTabType` (code / name / statuses), so the
 * helpers and the tab bar read identically; only the source differs.
 *
 * `statuses: []` on "All" reads as "no filter" (the whole table), matching the
 * bills convention where the default tab's empty group is the grand total.
 */
export interface VendorTab {
  /** URL-safe slug used as the `?tab=` param. */
  code: string;
  /** Human label rendered in the tab bar. */
  name: string;
  /** The vendor states this tab rolls up. Empty = no filter (All). */
  statuses: readonly VendorStatusType[];
}

export const VENDOR_TABS: readonly VendorTab[] = [
  { code: 'all', name: 'All', statuses: [] },
  { code: 'active', name: 'Active', statuses: ['active'] },
  { code: 'inactive', name: 'Inactive', statuses: ['inactive'] },
];
