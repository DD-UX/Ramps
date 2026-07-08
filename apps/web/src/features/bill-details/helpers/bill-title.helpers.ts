/**
 * A bill's display title, Ramp-style: `"Clarity Online INV# 4072"` — the one
 * string the detail screen repeats in its pinned header, its big page title
 * and each rail card (frames 1/06). Vendor-less bills (email-ingested drafts
 * awaiting a match) fall back to the same "Unmatched vendor" the list uses;
 * bills without an invoice number are just the vendor name.
 */
export function billTitle(bill: {
  vendor_name: string | null;
  invoice_number: string | null;
}): string {
  const vendor = bill.vendor_name ?? 'Unmatched vendor';
  return bill.invoice_number ? `${vendor} INV# ${bill.invoice_number}` : vendor;
}
