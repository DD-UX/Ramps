import { describe, expect, it, vi } from 'vitest';

import { countBillsByStatus, listBills } from './bills.js';
import type { ServerSupabase } from './server.js';

/**
 * The facade owns the DB→schema contract: it shapes the PostgREST select,
 * flattens the embedded vendor to `vendor_name`, and `.parse()`s every row
 * against `BillListItemSchema`. These tests mock the Supabase query builder so
 * we assert that contract without a live DB:
 *  - the vendor embed is flattened (and null-safe for vendor-less drafts),
 *  - the status filter is only applied when asked,
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
  const calls = { eq: [] as [string, unknown][], select: [] as string[] };
  const builder: Record<string, unknown> = {
    select(sel: string) {
      calls.select.push(sel);
      return builder;
    },
    eq(col: string, val: unknown) {
      calls.eq.push([col, val]);
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

  it('applies the status filter only when a status is given', async () => {
    const withStatus = makeSupabase({ data: [], count: 0 });
    await listBills(withStatus.supabase, { status: 'paid' });
    expect(withStatus.calls.eq).toContainEqual(['status', 'paid']);

    const without = makeSupabase({ data: [], count: 0 });
    await listBills(without.supabase);
    expect(without.calls.eq.some(([col]) => col === 'status')).toBe(false);
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
