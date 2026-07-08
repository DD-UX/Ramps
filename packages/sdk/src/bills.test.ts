import { describe, expect, it, vi } from 'vitest';

import {
  BillNotEditableError,
  countBillsByStatus,
  listBills,
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

/**
 * A chainable Supabase-query stub. `.select/.eq/.order` return `this` and the
 * builder is awaitable (a thenable) resolving to `{ data, error, count }` —
 * the exact surface the facade touches. `select` calls are recorded so we can
 * assert the status filter.
 */
function makeSupabase(result: { data?: unknown; error?: unknown; count?: number }) {
  const calls = {
    eq: [] as [string, unknown][],
    in: [] as [string, unknown[]][],
    or: [] as string[],
    select: [] as string[],
  };
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
    order() {
      return builder;
    },
    then(resolve: (v: unknown) => unknown) {
      return Promise.resolve({
        data: result.data ?? null,
        error: result.error ?? null,
        count: result.count,
      }).then(resolve);
    },
  };
  const from = vi.fn(() => builder);
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
    // A real term OR-combines across the bill's own identifying columns.
    const searched = makeSupabase({ data: [], count: 0 });
    await listBills(searched.supabase, { search: 'INV-42' });
    expect(searched.calls.or).toEqual([
      'invoice_number.ilike.%INV-42%,po_number.ilike.%INV-42%,memo.ilike.%INV-42%',
    ]);

    // The clause delimiters `(),` are stripped so a stray paren can't 400 the
    // query — here they collapse to a blank term, which is a no-op (not "match
    // all"), so no `.or()` is issued.
    const punctuation = makeSupabase({ data: [], count: 0 });
    await listBills(punctuation.supabase, { search: '(),' });
    expect(punctuation.calls.or).toHaveLength(0);

    // Omitting search entirely issues no text filter.
    const omitted = makeSupabase({ data: [], count: 0 });
    await listBills(omitted.supabase);
    expect(omitted.calls.or).toHaveLength(0);
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
