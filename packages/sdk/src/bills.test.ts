import { describe, expect, it, vi } from 'vitest';

import {
  archiveBill,
  BillNotEditableError,
  countBillsByStatus,
  createDemoBill,
  listBills,
  rejectBill,
  rollPaymentNow,
  saveBill,
  submitBill,
} from './bills.js';
import type { ServerSupabase } from './server.js';

/**
 * The facade owns the DB→schema contract: it shapes the PostgREST select,
 * flattens the embedded vendor to `vendor_name`, and `.parse()`s every row
 * against `BillListItemSchema`. These tests mock the Supabase query builder so
 * we assert that contract without a live DB:
 *  - the vendor embed is flattened (and null-safe for vendor-less drafts),
 *  - the status-group filter (`status IN (…)`) is only applied when asked,
 *  - the free-text search (`col ILIKE …`) is only applied for a real term,
 *  - a DB error is normalized and thrown,
 *  - a row the schema rejects fails loudly (the boundary guard bites).
 */

/** A canonical PostgREST row for the join in BILL_LIST_SELECT. */
function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    vendor_id: '22222222-2222-4222-8222-222222222222',
    entity_id: null,
    created_by: '33333333-3333-4333-8333-333333333333',
    source: 'manual',
    invoice_number: 'INV-1',
    invoice_date: '2025-01-01',
    due_date: '2025-02-01',
    accounting_date: null,
    po_number: null,
    amount_cents: 129755,
    currency: 'USD',
    memo: null,
    document_url: null,
    status: 'awaiting_approval',
    vendors: { name: 'Acme Inc' },
    flags: [],
    ...overrides,
  };
}

/** One awaited query's resolution — `{ data, error, count }`. */
type QueryResult = { data?: unknown; error?: unknown; count?: number };

/**
 * A chainable Supabase-query stub. `.select/.eq/.in/.or/.ilike/.order` return
 * `this` and the builder is awaitable (a thenable) resolving to
 * `{ data, error, count }` — the exact surface the facade touches. `select`,
 * `eq`, `in`, `or`, and `ilike` calls are recorded so we can assert the filters.
 *
 * `result` is the resolution for the MAIN `from('bills')` query. `vendorMatches`
 * (optional) is the resolution for the vendor name→id pre-query
 * (`from('vendors').select('id').ilike('name', …)`) that vendor search runs
 * first; each `from(table)` gets its own recorded builder + result.
 */
function makeSupabase(
  result: QueryResult,
  vendorMatches: QueryResult = { data: [] },
) {
  const calls = {
    eq: [] as [string, unknown][],
    in: [] as [string, unknown[]][],
    or: [] as string[],
    select: [] as string[],
    ilike: [] as [string, string][],
  };
  const makeBuilder = (resolution: QueryResult): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      select(sel: string) {
        calls.select.push(sel);
        return builder;
      },
      eq(col: string, val: unknown) {
        calls.eq.push([col, val]);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        calls.in.push([col, vals]);
        return builder;
      },
      or(clause: string) {
        calls.or.push(clause);
        return builder;
      },
      ilike(col: string, pattern: string) {
        calls.ilike.push([col, pattern]);
        return builder;
      },
      order() {
        return builder;
      },
      then(resolve: (v: unknown) => unknown) {
        return Promise.resolve({
          data: resolution.data ?? null,
          error: resolution.error ?? null,
          count: resolution.count,
        }).then(resolve);
      },
    };
    return builder;
  };
  const from = vi.fn((table: string) =>
    makeBuilder(table === 'vendors' ? vendorMatches : result),
  );
  return { supabase: { from } as unknown as ServerSupabase, calls, from };
}

describe('listBills', () => {
  it('flattens the embedded vendor to vendor_name and parses rows', async () => {
    const { supabase } = makeSupabase({ data: [makeRow()], count: 1 });
    const { bills, total } = await listBills(supabase);

    expect(total).toBe(1);
    expect(bills).toHaveLength(1);
    expect(bills[0].vendor_name).toBe('Acme Inc');
    // The embedded `vendors` object must not leak through — only vendor_name.
    expect(bills[0]).not.toHaveProperty('vendors');
  });

  it('maps a vendor-less draft to a null vendor_name', async () => {
    const row = makeRow({ vendor_id: null, vendors: null, status: 'missing_info' });
    const { supabase } = makeSupabase({ data: [row], count: 1 });
    const { bills } = await listBills(supabase);
    expect(bills[0].vendor_name).toBeNull();
  });

  it('applies the status-group filter (status IN …) only when a group is given', async () => {
    // A multi-status tab like "For payment" filters with `status IN (…)`.
    const grouped = makeSupabase({ data: [], count: 0 });
    await listBills(grouped.supabase, { statuses: ['approved', 'scheduled', 'partially_paid'] });
    expect(grouped.calls.in).toContainEqual([
      'status',
      ['approved', 'scheduled', 'partially_paid'],
    ]);

    // Overview passes an empty group — no status filter at all.
    const overview = makeSupabase({ data: [], count: 0 });
    await listBills(overview.supabase, { statuses: [] });
    expect(overview.calls.in.some(([col]) => col === 'status')).toBe(false);

    // Omitting the option entirely is the same as Overview.
    const omitted = makeSupabase({ data: [], count: 0 });
    await listBills(omitted.supabase);
    expect(omitted.calls.in.some(([col]) => col === 'status')).toBe(false);
  });

  it('applies the free-text search (col ILIKE …) only for a non-empty term', async () => {
    // A real term with NO vendor-name match OR-combines across the bill's own
    // identifying columns only (the vendor pre-query returns nothing).
    const searched = makeSupabase({ data: [], count: 0 }, { data: [] });
    await listBills(searched.supabase, { search: 'INV-42' });
    expect(searched.calls.or).toEqual([
      'invoice_number.ilike.%INV-42%,po_number.ilike.%INV-42%,memo.ilike.%INV-42%',
    ]);

    // The clause delimiters `(),` are stripped so a stray paren can't 400 the
    // query — here they collapse to a blank term, which is a no-op (not "match
    // all"), so no `.or()` (and no vendor pre-query) is issued.
    const punctuation = makeSupabase({ data: [], count: 0 });
    await listBills(punctuation.supabase, { search: '(),' });
    expect(punctuation.calls.or).toHaveLength(0);
    expect(punctuation.calls.ilike).toHaveLength(0);

    // Omitting search entirely issues no text filter.
    const omitted = makeSupabase({ data: [], count: 0 });
    await listBills(omitted.supabase);
    expect(omitted.calls.or).toHaveLength(0);
  });

  it('folds matching vendors into the OR so a bill matches on its vendor name', async () => {
    // The term matches two vendors by name; their ids join the SAME OR clause as
    // a `vendor_id.in.(…)` predicate, so a bill matches on its own columns OR
    // because its vendor is named "Acme".
    const vendorIdA = '22222222-2222-4222-8222-222222222222';
    const vendorIdB = '44444444-4444-4444-8444-444444444444';
    const searched = makeSupabase(
      { data: [], count: 0 },
      { data: [{ id: vendorIdA }, { id: vendorIdB }] },
    );
    await listBills(searched.supabase, { search: 'Acme' });

    // The pre-query looks vendors up by name, case-insensitively.
    expect(searched.calls.ilike).toContainEqual(['name', '%Acme%']);
    // …and their ids ride along in the bills OR clause.
    expect(searched.calls.or).toEqual([
      `invoice_number.ilike.%Acme%,po_number.ilike.%Acme%,memo.ilike.%Acme%,vendor_id.in.(${vendorIdA},${vendorIdB})`,
    ]);
  });

  it('propagates a normalized error when the vendor pre-query fails', async () => {
    const searched = makeSupabase(
      { data: [], count: 0 },
      { error: { message: 'vendor lookup down', code: 'XX000' } },
    );
    await expect(listBills(searched.supabase, { search: 'Acme' })).rejects.toThrow(
      '[XX000] vendor lookup down',
    );
  });

  it('throws a normalized error when the query fails', async () => {
    const { supabase } = makeSupabase({ error: { message: 'db down', code: 'XX000' } });
    await expect(listBills(supabase)).rejects.toThrow('[XX000] db down');
  });

  it('rejects a row the schema cannot validate (boundary guard)', async () => {
    // A status outside the lifecycle enum must fail at .parse() — the schema is
    // the boundary guard, so a shape the DB shouldn't produce blows up here.
    const { supabase } = makeSupabase({ data: [makeRow({ status: 'not_a_status' })], count: 1 });
    await expect(listBills(supabase)).rejects.toThrow();
  });

  it('falls back to the row count when the DB omits count', async () => {
    const { supabase } = makeSupabase({ data: [makeRow(), makeRow()] });
    const { total } = await listBills(supabase);
    expect(total).toBe(2);
  });
});

describe('countBillsByStatus', () => {
  it('tallies rows by status', async () => {
    const { supabase } = makeSupabase({
      data: [{ status: 'paid' }, { status: 'paid' }, { status: 'draft' }],
    });
    const counts = await countBillsByStatus(supabase);
    expect(counts).toEqual({ paid: 2, draft: 1 });
  });

  it('returns an empty tally for no rows', async () => {
    const { supabase } = makeSupabase({ data: [] });
    expect(await countBillsByStatus(supabase)).toEqual({});
  });

  it('throws a normalized error on failure', async () => {
    const { supabase } = makeSupabase({ error: { message: 'nope' } });
    await expect(countBillsByStatus(supabase)).rejects.toThrow('nope');
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * WRITES — saveBill (header UPDATE + line replace-all) and submitBill.
 *
 * saveBill touches the DB five times in order: the guard read (getBill →
 * `.maybeSingle()`), the header `.update().eq()`, the line `.delete().eq()`,
 * the line `.insert()`, and the re-read (getBill again). submitBill adds a
 * status `.update().eq()` and a final re-read. The stub below QUEUES a result
 * per `from()` call and records every write op's table + payload, so we can
 * assert the exact contract (order NULL-ing, `line_no` re-derivation, the
 * transition guard) without a live DB.
 * ──────────────────────────────────────────────────────────────────────── */

/** A full BillDetailSchema-valid row the detail read returns. */
function makeDetailRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b0000000-0000-4000-8000-00000000d001',
    vendor_id: '22222222-2222-4222-8222-222222222222',
    entity_id: null,
    created_by: '33333333-3333-4333-8333-333333333333',
    source: 'manual',
    invoice_number: 'INV-1',
    invoice_date: '2025-01-01',
    due_date: '2025-02-01',
    accounting_date: null,
    po_number: null,
    amount_cents: 129755,
    currency: 'USD',
    memo: null,
    document_url: null,
    status: 'draft',
    vendors: { name: 'Acme Inc' },
    entities: null,
    line_items: [],
    flags: [],
    approvals: [],
    approval_stages: [],
    payments: [],
    ...overrides,
  };
}

/** A canonical PAID-able payment row (embedded under a detail read's `payments`). */
function makePaymentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e0000000-0000-4000-8000-00000000e001',
    bill_id: 'b0000000-0000-4000-8000-00000000d001',
    method: 'ach',
    account_id: 'c0000000-0000-4000-8000-00000000c001',
    amount_cents: 129755,
    scheduled_date: '2025-06-01',
    arrival_date: null,
    batch_id: null,
    status: 'scheduled',
    failure_reason: null,
    ...overrides,
  };
}

/** A minimal, valid BillSaveType (edit-form) payload. */
function makeSavePayload(overrides: Record<string, unknown> = {}) {
  return {
    vendor_id: '22222222-2222-4222-8222-222222222222',
    entity_id: null,
    invoice_number: 'INV-9',
    invoice_date: '2025-03-01',
    due_date: '2025-04-01',
    accounting_date: null,
    po_number: '',
    amount_cents: 5000,
    currency: 'USD',
    memo: '',
    line_items: [],
    ...overrides,
  };
}

/**
 * A write-aware Supabase stub. Each `from(table)` returns a builder whose
 * terminal (`.maybeSingle()` or the awaited thenable) resolves the NEXT queued
 * result. `.update/.insert/.delete` record `{ table, op, payload }` on `ops`
 * so tests can assert the exact writes and their order.
 */
function makeWriteSupabase(results: { data?: unknown; error?: unknown }[]) {
  const queue = [...results];
  const ops: { table: string; op: string; payload?: unknown }[] = [];
  const next = () => queue.shift() ?? { data: null, error: null };

  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {
      select() {
        return builder;
      },
      eq() {
        return builder;
      },
      order() {
        return builder;
      },
      update(payload: unknown) {
        ops.push({ table, op: 'update', payload });
        return builder;
      },
      insert(payload: unknown) {
        ops.push({ table, op: 'insert', payload });
        return builder;
      },
      delete() {
        ops.push({ table, op: 'delete' });
        return builder;
      },
      maybeSingle() {
        return Promise.resolve(next());
      },
      then(resolve: (v: unknown) => unknown) {
        return Promise.resolve(next()).then(resolve);
      },
    };
    return builder;
  });
  return { supabase: { from } as unknown as ServerSupabase, ops, from };
}

describe('saveBill', () => {
  it('updates the header (blank text → NULL) and replace-alls the lines', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'draft' }) }, // guard read
      { error: null }, // header update
      { error: null }, // line delete
      { error: null }, // line insert
      { data: makeDetailRow({ status: 'draft' }) }, // re-read
    ]);

    const saved = await saveBill(
      supabase,
      'b0000000-0000-4000-8000-00000000d001',
      makeSavePayload({
        po_number: '',
        memo: '',
        line_items: [
          {
            id: null,
            kind: 'expense',
            description: 'Consulting',
            qty: null,
            unit_price_cents: null,
            amount_cents: 5000,
            gl_account_id: null,
            department_id: null,
            class_id: null,
            location_id: null,
            tax_code_id: null,
            custom_dimension_id: null,
            billable: false,
          },
        ],
      }),
    );

    expect(saved.status).toBe('draft');

    const header = ops.find((o) => o.table === 'bills' && o.op === 'update');
    expect(header).toBeDefined();
    // Blank strings persist as NULL, not ''.
    expect((header!.payload as Record<string, unknown>).po_number).toBeNull();
    expect((header!.payload as Record<string, unknown>).memo).toBeNull();

    // Lines are cleared then re-inserted with re-derived line_no starting at 1.
    const del = ops.find((o) => o.table === 'bill_line_items' && o.op === 'delete');
    const ins = ops.find((o) => o.table === 'bill_line_items' && o.op === 'insert');
    expect(del).toBeDefined();
    expect(ins).toBeDefined();
    const rows = ins!.payload as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0].line_no).toBe(1);
    expect(rows[0].bill_id).toBe('b0000000-0000-4000-8000-00000000d001');
  });

  it('skips the insert when the form has no lines (delete only)', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'missing_info' }) },
      { error: null },
      { error: null }, // delete
      { data: makeDetailRow({ status: 'missing_info' }) },
    ]);

    await saveBill(supabase, 'b0000000-0000-4000-8000-00000000d001', makeSavePayload());

    expect(ops.some((o) => o.table === 'bill_line_items' && o.op === 'delete')).toBe(true);
    expect(ops.some((o) => o.table === 'bill_line_items' && o.op === 'insert')).toBe(false);
  });

  it('still saves an awaiting_approval bill — it is editable in the queue', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'awaiting_approval' }) }, // guard read
      { error: null }, // header update
      { error: null }, // line delete
      { data: makeDetailRow({ status: 'awaiting_approval' }) }, // re-read
    ]);

    const saved = await saveBill(
      supabase,
      'b0000000-0000-4000-8000-00000000d001',
      makeSavePayload(),
    );

    expect(saved.status).toBe('awaiting_approval');
    // The guard passed: the header UPDATE actually ran.
    expect(ops.some((o) => o.table === 'bills' && o.op === 'update')).toBe(true);
  });

  it('refuses a LOCKED bill from approved onward (BillNotEditableError)', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'approved' }) }, // guard read only
    ]);

    await expect(
      saveBill(supabase, 'b0000000-0000-4000-8000-00000000d001', makeSavePayload()),
    ).rejects.toBeInstanceOf(BillNotEditableError);

    // No write ever runs — the guard bites before any UPDATE/DELETE.
    expect(ops).toHaveLength(0);
  });

  it('throws when the bill does not exist', async () => {
    const { supabase } = makeWriteSupabase([{ data: null }]);
    await expect(
      saveBill(supabase, 'b0000000-0000-4000-8000-00000000d001', makeSavePayload()),
    ).rejects.toThrow();
  });
});

describe('submitBill', () => {
  it('saves, then moves the bill to awaiting_approval', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'draft' }) }, // saveBill guard read
      { error: null }, // header update
      { error: null }, // line delete
      { data: makeDetailRow({ status: 'draft' }) }, // saveBill re-read
      { error: null }, // status update
      { data: makeDetailRow({ status: 'awaiting_approval' }) }, // final re-read
    ]);

    const submitted = await submitBill(
      supabase,
      'b0000000-0000-4000-8000-00000000d001',
      makeSavePayload(),
    );

    expect(submitted.status).toBe('awaiting_approval');
    // The last bills update carries the status transition.
    const statusUpdate = ops
      .filter((o) => o.table === 'bills' && o.op === 'update')
      .at(-1);
    expect((statusUpdate!.payload as Record<string, unknown>).status).toBe('awaiting_approval');
  });

  it('refuses to submit a bill that is not editable', async () => {
    const { supabase } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'approved' }) }, // saveBill guard read
    ]);

    await expect(
      submitBill(supabase, 'b0000000-0000-4000-8000-00000000d001', makeSavePayload()),
    ).rejects.toBeInstanceOf(BillNotEditableError);
  });
});

describe('rollPaymentNow', () => {
  it('settles the payment (paid, dates → today) and moves the bill to paid', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { supabase, ops } = makeWriteSupabase([
      // guard read: a scheduled bill carrying its live payment
      {
        data: makeDetailRow({ status: 'scheduled', payments: [makePaymentRow()] }),
      },
      { error: null }, // payments update
      { error: null }, // bills status update
      // final re-read: the now-paid bill
      {
        data: makeDetailRow({
          status: 'paid',
          payments: [
            makePaymentRow({ status: 'paid', scheduled_date: today, arrival_date: today }),
          ],
        }),
      },
    ]);

    const paid = await rollPaymentNow(supabase, 'b0000000-0000-4000-8000-00000000d001');

    expect(paid.status).toBe('paid');

    // The payment row is settled: status paid, and both dates pulled to today.
    const settle = ops.find((o) => o.table === 'payments' && o.op === 'update');
    expect(settle).toBeDefined();
    const payload = settle!.payload as Record<string, unknown>;
    expect(payload.status).toBe('paid');
    expect(payload.scheduled_date).toBe(today);
    expect(payload.arrival_date).toBe(today);

    // The bill is advanced to paid.
    const move = ops.find((o) => o.table === 'bills' && o.op === 'update');
    expect((move!.payload as Record<string, unknown>).status).toBe('paid');
  });

  it('also completes a partially_paid bill (partially_paid → paid)', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'partially_paid', payments: [makePaymentRow()] }) },
      { error: null }, // payments update
      { error: null }, // bills status update
      { data: makeDetailRow({ status: 'paid', payments: [makePaymentRow({ status: 'paid' })] }) },
    ]);

    const paid = await rollPaymentNow(supabase, 'b0000000-0000-4000-8000-00000000d001');

    expect(paid.status).toBe('paid');
    // The transition guard admits partially_paid → paid, so both writes ran.
    expect(ops.some((o) => o.table === 'payments' && o.op === 'update')).toBe(true);
    expect(ops.some((o) => o.table === 'bills' && o.op === 'update')).toBe(true);
  });

  it('refuses a bill that is not scheduled (BillNotEditableError, no writes)', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'approved', payments: [makePaymentRow()] }) },
    ]);

    await expect(
      rollPaymentNow(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toBeInstanceOf(BillNotEditableError);

    // The transition guard bites before any settle/advance write.
    expect(ops).toHaveLength(0);
  });

  it('throws when the scheduled bill has no live payment to complete', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'scheduled', payments: [] }) },
    ]);

    await expect(
      rollPaymentNow(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toThrow();

    // No payment → no writes: neither the settle nor the status move ran.
    expect(ops).toHaveLength(0);
  });

  it('throws when the bill does not exist', async () => {
    const { supabase } = makeWriteSupabase([{ data: null }]);

    await expect(
      rollPaymentNow(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toThrow();
  });
});

describe('archiveBill', () => {
  it('moves an approved bill to archived (a legal move from any non-archived state)', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'approved' }) }, // guard read
      { error: null }, // bills status update
      { data: makeDetailRow({ status: 'archived' }) }, // re-read
    ]);

    const archived = await archiveBill(supabase, 'b0000000-0000-4000-8000-00000000d001');

    expect(archived.status).toBe('archived');
    const move = ops.find((o) => o.table === 'bills' && o.op === 'update');
    expect((move!.payload as Record<string, unknown>).status).toBe('archived');
  });

  it('archives a paid bill too (paid → archived is legal)', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'paid', payments: [makePaymentRow({ status: 'paid' })] }) },
      { error: null },
      { data: makeDetailRow({ status: 'archived' }) },
    ]);

    const archived = await archiveBill(supabase, 'b0000000-0000-4000-8000-00000000d001');
    expect(archived.status).toBe('archived');
    expect(ops.some((o) => o.table === 'bills' && o.op === 'update')).toBe(true);
  });

  it('refuses an already-archived bill (BillNotEditableError, no writes)', async () => {
    const { supabase, ops } = makeWriteSupabase([{ data: makeDetailRow({ status: 'archived' }) }]);

    await expect(
      archiveBill(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toBeInstanceOf(BillNotEditableError);

    // The transition guard bites before any status write.
    expect(ops).toHaveLength(0);
  });

  it('throws when the bill does not exist', async () => {
    const { supabase } = makeWriteSupabase([{ data: null }]);
    await expect(
      archiveBill(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toThrow();
  });
});

describe('rejectBill', () => {
  it('moves an awaiting_approval bill to rejected', async () => {
    const { supabase, ops } = makeWriteSupabase([
      { data: makeDetailRow({ status: 'awaiting_approval' }) }, // guard read
      { error: null }, // bills status update
      { data: makeDetailRow({ status: 'rejected' }) }, // re-read
    ]);

    const rejected = await rejectBill(supabase, 'b0000000-0000-4000-8000-00000000d001');

    expect(rejected.status).toBe('rejected');
    const move = ops.find((o) => o.table === 'bills' && o.op === 'update');
    expect((move!.payload as Record<string, unknown>).status).toBe('rejected');
  });

  it('refuses to reject anything past the queue (approved → rejected is illegal, no writes)', async () => {
    const { supabase, ops } = makeWriteSupabase([{ data: makeDetailRow({ status: 'approved' }) }]);

    await expect(
      rejectBill(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toBeInstanceOf(BillNotEditableError);

    expect(ops).toHaveLength(0);
  });

  it('refuses to reject a pre-submit draft (draft → rejected is illegal)', async () => {
    const { supabase, ops } = makeWriteSupabase([{ data: makeDetailRow({ status: 'draft' }) }]);

    await expect(
      rejectBill(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toBeInstanceOf(BillNotEditableError);

    expect(ops).toHaveLength(0);
  });

  it('throws when the bill does not exist', async () => {
    const { supabase } = makeWriteSupabase([{ data: null }]);
    await expect(
      rejectBill(supabase, 'b0000000-0000-4000-8000-00000000d001'),
    ).rejects.toThrow();
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * CREATE A BILL — createDemoBill (the demo generator)
 *
 * The generator does five things per call: load the catalog (vendors/entities/
 * users/gl/departments in parallel), insert the header (`.select('id').single()`),
 * insert the lines, render + upload a PDF to Storage, backfill document_url, and
 * re-read via getBill. The stub below serves the catalog by table, hands the
 * header insert a fresh id, records every write, and fakes `.storage`. We assert
 * the demo contract: only draft/missing_info, a complete PDF is always uploaded,
 * document_url is backfilled, missing_info blanks the row, and the PO coin flip
 * lands both ways.
 * ──────────────────────────────────────────────────────────────────────── */

/** Catalog rows keyed by table for the parallel loadDemoCatalog reads. */
const DEMO_CATALOG: Record<string, unknown[]> = {
  vendors: [{ id: 'a0000000-0000-4000-8000-0000000000e1', name: 'W.B. Mason' }],
  entities: [{ id: '22222222-2222-4222-8222-222222222201' }],
  users: [{ id: '11111111-1111-4111-8111-111111111102' }],
  gl_accounts: [{ id: '33333333-3333-4333-8333-333333333301' }],
  departments: [{ id: '44444444-4444-4444-8444-444444444401' }],
};

const NEW_BILL_ID = 'b0000000-0000-4000-8000-00000000e999';

interface DemoStubResult {
  ops: { table: string; op: string; payload?: unknown }[];
  uploads: { path: string; contentType?: string }[];
  supabase: ServerSupabase;
}

/**
 * A createDemoBill-aware Supabase stub. Catalog `select`s resolve per-table from
 * DEMO_CATALOG; the header insert returns NEW_BILL_ID via `.select().single()`;
 * getBill's `.maybeSingle()` returns a matching detail row. `.storage.from().upload()`
 * is recorded and succeeds. `overrides` lets a test blank a catalog table (e.g.
 * no users) or force an upload error.
 */
function makeDemoSupabase(
  overrides: {
    catalog?: Partial<Record<string, unknown[]>>;
    uploadError?: unknown;
    detailRow?: Record<string, unknown>;
  } = {},
): DemoStubResult {
  const catalog = { ...DEMO_CATALOG, ...overrides.catalog };
  const ops: DemoStubResult['ops'] = [];
  const uploads: DemoStubResult['uploads'] = [];

  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {
      select() {
        return builder;
      },
      eq() {
        return builder;
      },
      in() {
        return builder;
      },
      order() {
        return builder;
      },
      insert(payload: unknown) {
        ops.push({ table, op: 'insert', payload });
        return builder;
      },
      update(payload: unknown) {
        ops.push({ table, op: 'update', payload });
        return builder;
      },
      single() {
        // Only the header insert calls .select('id').single().
        return Promise.resolve({ data: { id: NEW_BILL_ID }, error: null });
      },
      maybeSingle() {
        // getBill's re-read — a full detail row for the new bill.
        return Promise.resolve({
          data: overrides.detailRow ?? makeDetailRow({ id: NEW_BILL_ID, status: 'draft' }),
          error: null,
        });
      },
      then(resolve: (v: unknown) => unknown) {
        // A bare-awaited builder is a catalog read (or a write result).
        return Promise.resolve({ data: catalog[table] ?? [], error: null }).then(resolve);
      },
    };
    return builder;
  });

  const storage = {
    from: vi.fn(() => ({
      upload: vi.fn((path: string, _bytes: unknown, opts: { contentType?: string }) => {
        uploads.push({ path, contentType: opts?.contentType });
        return Promise.resolve({ error: overrides.uploadError ?? null });
      }),
    })),
  };

  return { ops, uploads, supabase: { from, storage } as unknown as ServerSupabase };
}

describe('createDemoBill', () => {
  it('mints a draft or missing_info bill, always uploads a PDF, and backfills document_url', async () => {
    // Force the draft branch so the assertions are deterministic.
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    try {
      const stub = makeDemoSupabase();
      const bill = await createDemoBill(stub.supabase);

      expect(['draft', 'missing_info']).toContain(bill.status);

      // The header insert ran and carried a valid demo source.
      const header = stub.ops.find((o) => o.table === 'bills' && o.op === 'insert');
      expect(header).toBeDefined();
      const headerPayload = header!.payload as Record<string, unknown>;
      expect(headerPayload.currency).toBe('USD');
      expect(headerPayload.amount_cents).toBeGreaterThan(0);

      // A complete invoice PDF is ALWAYS uploaded, at <bill_id>.pdf.
      expect(stub.uploads).toHaveLength(1);
      expect(stub.uploads[0].path).toBe(`${NEW_BILL_ID}.pdf`);
      expect(stub.uploads[0].contentType).toBe('application/pdf');

      // document_url is backfilled to the uploaded object path.
      const backfill = stub.ops
        .filter((o) => o.table === 'bills' && o.op === 'update')
        .at(-1);
      expect((backfill!.payload as Record<string, unknown>).document_url).toBe(
        `invoices/${NEW_BILL_ID}.pdf`,
      );
    } finally {
      rand.mockRestore();
    }
  });

  it('blanks the row for a missing_info bill but still uploads a complete PDF', async () => {
    // Math.random() >= 0.5 on the first call picks missing_info.
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    try {
      const stub = makeDemoSupabase({
        detailRow: makeDetailRow({
          id: NEW_BILL_ID,
          status: 'missing_info',
          vendor_id: null,
          vendors: null,
          invoice_number: null,
          invoice_date: null,
          due_date: null,
        }),
      });
      const bill = await createDemoBill(stub.supabase);
      expect(bill.status).toBe('missing_info');

      const header = stub.ops.find((o) => o.table === 'bills' && o.op === 'insert');
      const payload = header!.payload as Record<string, unknown>;
      // The ROW is deliberately sparse for missing_info…
      expect(payload.vendor_id).toBeNull();
      expect(payload.invoice_number).toBeNull();
      expect(payload.due_date).toBeNull();
      // …but a complete PDF is still drawn and uploaded.
      expect(stub.uploads).toHaveLength(1);
    } finally {
      rand.mockRestore();
    }
  });

  it('includes a PO number when the coin flip lands heads (draft branch)', async () => {
    // First random() (< 0.5) → draft; second (< 0.5) → withPo true.
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.0);
    try {
      const stub = makeDemoSupabase();
      await createDemoBill(stub.supabase);
      const header = stub.ops.find((o) => o.table === 'bills' && o.op === 'insert');
      expect((header!.payload as Record<string, unknown>).po_number).toMatch(/^PO-\d{4}$/);
    } finally {
      rand.mockRestore();
    }
  });

  it('omits the PO number when the coin flip lands tails (draft branch)', async () => {
    // draft (first < 0.5) but withPo false (second >= 0.5). Sequence the flips.
    const seq = [0.1, 0.9];
    let i = 0;
    const rand = vi.spyOn(Math, 'random').mockImplementation(() => seq[i++] ?? 0.4);
    try {
      const stub = makeDemoSupabase();
      await createDemoBill(stub.supabase);
      const header = stub.ops.find((o) => o.table === 'bills' && o.op === 'insert');
      expect((header!.payload as Record<string, unknown>).po_number).toBeNull();
    } finally {
      rand.mockRestore();
    }
  });

  it('does not backfill document_url when the PDF upload fails (no orphaned error)', async () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    try {
      const stub = makeDemoSupabase({ uploadError: { message: 'storage down' } });
      // The bill is still returned — a failed document must not fail the create.
      const bill = await createDemoBill(stub.supabase);
      expect(bill.id).toBe(NEW_BILL_ID);
      const backfill = stub.ops.find(
        (o) =>
          o.table === 'bills' &&
          o.op === 'update' &&
          'document_url' in (o.payload as Record<string, unknown>),
      );
      expect(backfill).toBeUndefined();
    } finally {
      rand.mockRestore();
    }
  });

  it('throws when there is no user to author the bill', async () => {
    const stub = makeDemoSupabase({ catalog: { users: [] } });
    await expect(createDemoBill(stub.supabase)).rejects.toThrow(/user/i);
  });
});
