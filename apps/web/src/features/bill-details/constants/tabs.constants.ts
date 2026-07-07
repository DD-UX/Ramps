/**
 * The two header tabs on the bill-detail surface (snapshots 5–6): Overview holds
 * the coding form + document split, Activity holds the (currently empty) audit
 * trail. One list so the title and the surface that swaps the body agree on the
 * exact set and order.
 */
export const BILL_DETAILS_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
] as const;

export type BillDetailsTab = (typeof BILL_DETAILS_TABS)[number]['value'];
