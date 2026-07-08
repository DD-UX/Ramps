#!/usr/bin/env node
/**
 * generate-invoice-pdfs.mjs — one-off seed helper.
 *
 * The seeded bills have no real invoice documents, but the `/bills/[id]` detail
 * page renders the invoice side-by-side with the form. This script closes that
 * gap for the demo: for every bill it draws a simple, faithful invoice PDF from
 * the bill's OWN data (vendor, invoice #, dates, line items, total), uploads it
 * to the public `invoices` Supabase Storage bucket, and backfills
 * `bills.document_url` with the object path.
 *
 * Idempotent: re-running overwrites the same `invoices/<bill_id>.pdf` object and
 * re-points the column, so it's safe to run repeatedly.
 *
 * Env (read from apps/web/.env.local): SUPABASE_URL, SUPABASE_SECRET_KEY.
 * Run:  node scripts/generate-invoice-pdfs.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUCKET = 'invoices';

/** Minimal .env.local parser — no dependency, just KEY=VALUE lines. */
function loadEnv(path) {
  const env = {};
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // fall through — caller validates required keys
  }
  return env;
}

const env = loadEnv(resolve(ROOT, 'apps/web/.env.local'));
const SUPABASE_URL = process.env.SUPABASE_URL ?? env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY (checked apps/web/.env.local).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

/**
 * Invoice-content overrides, keyed by bill id.
 *
 * Draft / missing-info bills intentionally carry sparse rows (an unmatched
 * vendor, blank invoice number, missing dates, no coded lines) — that
 * incompleteness is the whole point of those states. But a *real* invoice
 * document is always complete: a vendor never mails you a blank page. Rendering
 * those rows verbatim would print an invoice full of "—", which reads as fake.
 *
 * So for those bills we render from this override instead of the row. The values
 * here are used ONLY to draw the PDF; they are never written back to `bills`, so
 * the row stays deliberately incomplete while the document looks like the real
 * thing the AP clerk is coding against. Every other bill renders from its own
 * (now complete) row and is untouched by this map.
 */
const INVOICE_OVERRIDES = {
  // d001 · draft · W.B. Mason — row is already complete; override kept for parity.
  'b0000000-0000-0000-0000-00000000d001': {
    vendor_name: 'W.B. Mason',
    invoice_number: 'WBM-4471',
    invoice_date: '2026-06-20',
    due_date: '2026-07-20',
    po_number: null,
    amount_cents: 128900,
    memo: 'Q2 office supplies',
    line_items: [
      { description: 'Paper & toner', qty: null, unit_price_cents: null, amount_cents: 89900 },
      { description: 'Breakroom supplies', qty: null, unit_price_cents: null, amount_cents: 39000 },
    ],
  },
  // d002 · missing_info · unmatched in the row → complete invoice from "Clearview Facilities".
  'b0000000-0000-0000-0000-00000000d002': {
    vendor_name: 'Clearview Facilities Inc.',
    invoice_number: 'CVF-20614',
    invoice_date: '2026-06-19',
    due_date: '2026-07-01',
    po_number: null,
    amount_cents: 45000,
    memo: 'June janitorial & facilities service',
    line_items: [
      { description: 'Monthly janitorial service', qty: null, unit_price_cents: null, amount_cents: 32000 },
      { description: 'Supplies restock', qty: null, unit_price_cents: null, amount_cents: 13000 },
    ],
  },
  // d101 · missing_info · unmatched in the row → complete invoice from "Beacon HVAC".
  'b0000000-0000-0000-0000-00000000d101': {
    vendor_name: 'Beacon HVAC Services',
    invoice_number: 'BEA-7788',
    invoice_date: '2026-07-02',
    due_date: '2026-07-25',
    po_number: null,
    amount_cents: 78000,
    memo: 'Quarterly HVAC maintenance',
    line_items: [
      { description: 'HVAC preventative maintenance — Q3', qty: null, unit_price_cents: null, amount_cents: 60000 },
      { description: 'Filter replacement (12 units)', qty: 12, unit_price_cents: 1500, amount_cents: 18000 },
    ],
  },
  // d102 · draft · W.B. Mason matched, but dates blank in the row → complete invoice.
  'b0000000-0000-0000-0000-00000000d102': {
    vendor_name: 'W.B. Mason',
    invoice_number: 'WBM-4502',
    invoice_date: '2026-07-01',
    due_date: '2026-07-31',
    po_number: null,
    amount_cents: 43200,
    memo: 'July office supplies',
    line_items: [
      { description: 'Office supplies — July', qty: null, unit_price_cents: null, amount_cents: 43200 },
    ],
  },
};

const dollars = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents ?? 0) / 100);
const fmtDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';

/** Draw one invoice PDF from a bill row → Uint8Array of PDF bytes. */
async function renderInvoice(bill) {
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

  const text = (s, x, yy, { size = 10, f = font, color = ink } = {}) =>
    page.drawText(String(s ?? ''), { x, y: yy, size, font: f, color });
  const rtext = (s, xRight, yy, opts = {}) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    const w = f.widthOfTextAtSize(String(s ?? ''), size);
    text(s, xRight - w, yy, opts);
  };
  const hr = (yy) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: right, y: yy }, thickness: 1, color: line });

  // Header
  text('INVOICE', M, y, { size: 22, f: bold });
  rtext(bill.vendor_name ?? 'Unknown vendor', right, y + 4, { size: 13, f: bold });
  rtext('Bill from', right, y + 20, { size: 8, color: hush });
  y -= 34;
  rtext(`Amount due  ${dollars(bill.amount_cents)}`, right, y, { size: 11, f: bold });
  y -= 22;
  hr(y);
  y -= 26;

  // Meta grid
  const meta = [
    ['Invoice number', bill.invoice_number ?? '—'],
    ['Invoice date', fmtDate(bill.invoice_date)],
    ['Due date', fmtDate(bill.due_date)],
    ['PO number', bill.po_number ?? '—'],
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

  const lines = bill.line_items?.length
    ? bill.line_items
    : [{ description: bill.memo ?? 'Services rendered', qty: null, unit_price_cents: null, amount_cents: bill.amount_cents }];

  for (const li of lines) {
    text(li.description ?? '—', M, y, { size: 10 });
    rtext(li.qty ?? '—', right - 210, y);
    rtext(li.unit_price_cents != null ? dollars(li.unit_price_cents) : '—', right - 90, y);
    rtext(dollars(li.amount_cents), right, y);
    y -= 20;
  }
  y -= 4;
  hr(y);
  y -= 24;

  rtext('Total due', right - 120, y, { size: 10, color: hush });
  rtext(dollars(bill.amount_cents), right, y, { size: 13, f: bold });

  // Footer note
  if (bill.memo) {
    text('Memo', M, 96, { size: 8, color: hush });
    text(bill.memo, M, 80, { size: 9, color: hush });
  }
  text('Generated invoice · Ramps demo data', M, 54, { size: 8, color: hush });

  return doc.save();
}

async function main() {
  const { data: bills, error } = await supabase
    .from('bills')
    .select(
      'id, invoice_number, invoice_date, due_date, amount_cents, currency, po_number, memo, status, vendors(name), line_items:bill_line_items(line_no, description, qty, unit_price_cents, amount_cents)',
    )
    .order('id');
  if (error) throw error;

  let ok = 0;
  for (const row of bills ?? []) {
    const override = INVOICE_OVERRIDES[row.id];
    const bill = {
      ...row,
      ...override, // draft/missing-info: draw a complete invoice, don't mirror the sparse row
      vendor_name: override?.vendor_name ?? row.vendors?.name ?? null,
      line_items: (override?.line_items ?? row.line_items ?? [])
        .slice()
        .sort((a, b) => (a.line_no ?? 0) - (b.line_no ?? 0)),
    };
    const bytes = await renderInvoice(bill);
    const path = `${bill.id}.pdf`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (upErr) {
      console.error(`✗ upload ${path}:`, upErr.message);
      continue;
    }

    const { error: colErr } = await supabase
      .from('bills')
      .update({ document_url: `${BUCKET}/${path}` })
      .eq('id', bill.id);
    if (colErr) {
      console.error(`✗ backfill ${bill.id}:`, colErr.message);
      continue;
    }
    ok += 1;
    console.log(`✓ ${bill.invoice_number ?? bill.id} → ${BUCKET}/${path}`);
  }
  console.log(`\nDone. ${ok}/${(bills ?? []).length} invoices generated & linked.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
