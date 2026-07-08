import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * @ramps/sdk/invoice-pdf — the invoice DOCUMENT renderer.
 *
 * A seeded bill's `/bills/[id]` page shows the invoice side-by-side with the
 * edit form, so every bill needs a real document to code against. This draws a
 * faithful one-page invoice PDF from a bill's own data — the SAME drawing that
 * `scripts/generate-invoice-pdfs.mjs` uses to backfill the seed, lifted here so
 * the one-off seed helper and the live "Create demo bill" server function render
 * pixel-identical documents from a single definition.
 *
 * A real invoice is ALWAYS complete — a vendor never mails a blank page. So the
 * input here is the complete document, distinct from the bill ROW: a
 * `missing_info` draft keeps a deliberately sparse row (unmatched vendor, blank
 * dates) while its PDF still reads as the real thing the AP clerk is looking at.
 */

/** One priced row on the invoice — mirrors a bill line item's visible fields. */
export interface InvoicePdfLineItem {
  description: string;
  qty: number | null;
  unit_price_cents: number | null;
  amount_cents: number;
}

/** The complete document to draw — never the sparse row, always the real invoice. */
export interface InvoicePdfData {
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  po_number: string | null;
  amount_cents: number;
  currency?: string | null;
  memo: string | null;
  line_items: InvoicePdfLineItem[];
}

const dollars = (cents: number | null | undefined): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents ?? 0) / 100);

const fmtDate = (iso: string | null | undefined): string =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';

/**
 * Draw one invoice PDF from a bill's data → PDF bytes. Pure and deterministic
 * given its input (no I/O, no clock) — the caller owns the upload and the
 * `document_url` backfill.
 */
export async function renderInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.09, 0.1, 0.12);
  const hush = rgb(0.42, 0.45, 0.5);
  const line = rgb(0.85, 0.86, 0.88);
  const M = 54; // margin
  const right = 612 - M;
  let y = 792 - 64;

  const text = (
    s: string | number | null | undefined,
    x: number,
    yy: number,
    opts: { size?: number; f?: typeof font; color?: typeof ink } = {},
  ) =>
    page.drawText(String(s ?? ''), {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: opts.color ?? ink,
    });
  const rtext = (
    s: string | number | null | undefined,
    xRight: number,
    yy: number,
    opts: { size?: number; f?: typeof font; color?: typeof ink } = {},
  ) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    const w = f.widthOfTextAtSize(String(s ?? ''), size);
    text(s, xRight - w, yy, opts);
  };
  const hr = (yy: number) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: right, y: yy }, thickness: 1, color: line });

  // Header
  text('INVOICE', M, y, { size: 22, f: bold });
  rtext(data.vendor_name ?? 'Unknown vendor', right, y + 4, { size: 13, f: bold });
  rtext('Bill from', right, y + 20, { size: 8, color: hush });
  y -= 34;
  rtext(`Amount due  ${dollars(data.amount_cents)}`, right, y, { size: 11, f: bold });
  y -= 22;
  hr(y);
  y -= 26;

  // Meta grid
  const meta: [string, string][] = [
    ['Invoice number', data.invoice_number ?? '—'],
    ['Invoice date', fmtDate(data.invoice_date)],
    ['Due date', fmtDate(data.due_date)],
    ['PO number', data.po_number ?? '—'],
  ];
  for (const [label, value] of meta) {
    text(label, M, y, { size: 8, color: hush });
    text(value, M + 130, y, { size: 10, f: bold });
    y -= 20;
  }
  y -= 10;
  hr(y);
  y -= 22;

  // Line items table
  text('DESCRIPTION', M, y, { size: 8, color: hush });
  rtext('QTY', right - 210, y, { size: 8, color: hush });
  rtext('UNIT PRICE', right - 90, y, { size: 8, color: hush });
  rtext('AMOUNT', right, y, { size: 8, color: hush });
  y -= 8;
  hr(y);
  y -= 20;

  const lines: InvoicePdfLineItem[] = data.line_items.length
    ? data.line_items
    : [
        {
          description: data.memo ?? 'Services rendered',
          qty: null,
          unit_price_cents: null,
          amount_cents: data.amount_cents,
        },
      ];

  for (const li of lines) {
    text(li.description || '—', M, y, { size: 10 });
    rtext(li.qty ?? '—', right - 210, y);
    rtext(li.unit_price_cents != null ? dollars(li.unit_price_cents) : '—', right - 90, y);
    rtext(dollars(li.amount_cents), right, y);
    y -= 20;
  }
  y -= 4;
  hr(y);
  y -= 24;

  rtext('Total due', right - 120, y, { size: 10, color: hush });
  rtext(dollars(data.amount_cents), right, y, { size: 13, f: bold });

  // Footer note
  if (data.memo) {
    text('Memo', M, 96, { size: 8, color: hush });
    text(data.memo, M, 80, { size: 9, color: hush });
  }
  text('Generated invoice · Ramps demo data', M, 54, { size: 8, color: hush });

  return doc.save();
}
