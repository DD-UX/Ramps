import { describe, expect, it, vi } from 'vitest';

import { listBillTabs } from './bill-tabs.js';
import type { ServerSupabase } from './server.js';

/**
 * The facade owns the DB→schema contract for the tab catalog: it selects the
 * lookup columns, orders by sort_order, and `.parse()`s every row against
 * `BillTabSchema`. These tests mock the Supabase query builder so we assert
 * that contract without a live DB:
 *  - valid rows parse through (statuses array preserved, Overview's empty group),
 *  - a DB error is normalized and thrown,
 *  - a row the schema rejects (a bad status in the array) fails loudly.
 */

/** A canonical bill_tabs row. */
function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '99999999-9999-9999-9999-999999999902',
    name: 'Drafts',
    code: 'drafts',
    statuses: ['draft', 'missing_info'],
    sort_order: 1,
    created_by: null,
    ...overrides,
  };
}

/**
 * A chainable Supabase-query stub. `.select/.order` return `this` and the
 * builder is awaitable (a thenable) resolving to `{ data, error }` — the exact
 * surface the facade touches.
 */
function makeSupabase(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {
    select() {
      return builder;
    },
    order() {
      return builder;
    },
    then(resolve: (v: unknown) => unknown) {
      return Promise.resolve({
        data: result.data ?? null,
        error: result.error ?? null,
      }).then(resolve);
    },
  };
  const from = vi.fn(() => builder);
  return { supabase: { from } as unknown as ServerSupabase, from };
}

describe('listBillTabs', () => {
  it('parses the lookup rows, preserving the status groups', async () => {
    const { supabase } = makeSupabase({
      data: [
        makeRow({ name: 'Overview', code: 'overview', statuses: [], sort_order: 0 }),
        makeRow(),
      ],
    });
    const tabs = await listBillTabs(supabase);

    expect(tabs).toHaveLength(2);
    // Overview's empty group survives as an empty array (the "unfiltered" marker).
    expect(tabs[0].code).toBe('overview');
    expect(tabs[0].statuses).toEqual([]);
    expect(tabs[1].code).toBe('drafts');
    expect(tabs[1].statuses).toEqual(['draft', 'missing_info']);
  });

  it('returns an empty list when the table is empty', async () => {
    const { supabase } = makeSupabase({ data: [] });
    expect(await listBillTabs(supabase)).toEqual([]);
  });

  it('throws a normalized error when the query fails', async () => {
    const { supabase } = makeSupabase({ error: { message: 'db down', code: 'XX000' } });
    await expect(listBillTabs(supabase)).rejects.toThrow('[XX000] db down');
  });

  it('rejects a row with a status outside the lifecycle enum (boundary guard)', async () => {
    const { supabase } = makeSupabase({
      data: [makeRow({ statuses: ['draft', 'not_a_status'] })],
    });
    await expect(listBillTabs(supabase)).rejects.toThrow();
  });
});
