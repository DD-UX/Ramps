/**
 * The stable `value`s for the two bill-detail tabs — named so the surface can
 * compare `tab === BILL_DETAILS_TAB.OVERVIEW` instead of matching a bare string.
 * {@link BILL_DETAILS_TABS} derives its `value`s from these, so the picker and the
 * body that swaps on selection can never drift onto different literals.
 */
export const BILL_DETAILS_TAB = {
  OVERVIEW: 'overview',
  ACTIVITY: 'activity',
} as const;

/**
 * The two header tabs on the bill-detail surface (snapshots 5–6): Overview holds
 * the coding form + document split, Activity holds the (currently empty) audit
 * trail. One list so the picker and the surface that swaps the body agree on the
 * exact set and order.
 */
export const BILL_DETAILS_TABS = [
  { value: BILL_DETAILS_TAB.OVERVIEW, label: 'Overview' },
  { value: BILL_DETAILS_TAB.ACTIVITY, label: 'Activity' },
] as const;

export type BillDetailsTab = (typeof BILL_DETAILS_TABS)[number]['value'];

/**
 * The stable `value`s for the right pane's document tabs — named so the viewer can
 * branch on `tab === BILL_DETAILS_DOCUMENT_TAB.INVOICE` instead of a bare string.
 * {@link BILL_DETAILS_DOCUMENT_TABS} derives its `value`s from these.
 */
export const BILL_DETAILS_DOCUMENT_TAB = {
  INVOICE: 'invoice',
  DOCUMENTS: 'documents',
} as const;

/**
 * The two tabs on the right-hand document pane (snapshots 5–6): Invoice shows the
 * source PDF, Documents the (currently empty) supporting-file list. One list so
 * the picker and the viewer that swaps on selection agree on the set and order.
 */
export const BILL_DETAILS_DOCUMENT_TABS = [
  { value: BILL_DETAILS_DOCUMENT_TAB.INVOICE, label: 'Invoice' },
  { value: BILL_DETAILS_DOCUMENT_TAB.DOCUMENTS, label: 'Documents' },
] as const;

export type BillDetailsDocumentTab = (typeof BILL_DETAILS_DOCUMENT_TABS)[number]['value'];
