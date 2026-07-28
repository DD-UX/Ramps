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
 * The drawing itself is NOT here: it's `renderInvoicePdf` from
 * `@ramps/sdk/invoice-pdf` (imported from the built dist), so this seed helper
 * and the live "Create demo bill" server function render pixel-identical
 * documents from a single definition. Build the SDK first.
 *
 * Env (read from apps/web/.env.local): SUPABASE_URL, SUPABASE_SECRET_KEY.
 * Run:  pnpm --filter @ramps/sdk build && node scripts/generate-invoice-pdfs.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

// The one invoice drawing, shared with the app — a plain script can't resolve
// the workspace alias, so import the built artifact directly.
let renderInvoicePdf;
try {
  ({ renderInvoicePdf } = await import(
    new URL('../packages/sdk/dist/invoice-pdf.js', import.meta.url).href
  ));
} catch {
  console.error('Missing @ramps/sdk build — run `pnpm --filter @ramps/sdk build` first.');
  process.exit(1);
}

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
    const bytes = await renderInvoicePdf(bill);
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
