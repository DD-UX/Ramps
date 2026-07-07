import { describe, expect, it, vi } from 'vitest';

import { saveApprovalStages } from './approvals.js';
import type { ServerSupabase } from './server.js';

/**
 * `saveApprovalStages` is a replace-all write across three tables. These tests
 * mock the PostgREST query builder — one per table via `from(table)` — so we
 * assert the contract without a live DB:
 *  - the existing route is deleted first (cascades to the children),
 *  - stage parents are inserted in order with sequence = 1-based position,
 *  - each stage's roles/users fan out to the child tables keyed by stage id,
 *  - an empty chain deletes and returns [] without touching the child tables,
 *  - the returned model echoes the server ids and validates.
 */

const BILL_ID = 'b0000000-0000-4000-8000-00000000d001';
const USER_ID = '11111111-1111-4111-8111-111111111109';

/** A valid UUID the mock echoes for stage `n` (ApprovalStageSchema parses it). */
function stageIdFor(sequence: number): string {
  return `c0000000-0000-4000-8000-0000000000${String(sequence).padStart(2, '0')}`;
}

interface TableCalls {
  delete: number;
  deleteEq: [string, unknown][];
  insert: unknown[][];
}

/**
 * A per-table chainable stub. `insert` on `approval_stages` echoes generated
 * ids (`stage-<sequence>`) via `.select()`; the child tables just resolve ok.
 * Every builder is a thenable so `await`ing the terminal call resolves.
 */
function makeSupabase() {
  const calls: Record<string, TableCalls> = {};
  const seen = (table: string) =>
    (calls[table] ??= { delete: 0, deleteEq: [], insert: [] });

  function builderFor(table: string) {
    let mode: 'delete' | 'insert' | null = null;
    let insertedRows: Record<string, unknown>[] = [];

    const builder: Record<string, unknown> = {
      delete() {
        mode = 'delete';
        seen(table).delete += 1;
        return builder;
      },
      eq(col: string, val: unknown) {
        seen(table).deleteEq.push([col, val]);
        return builder;
      },
      insert(rows: Record<string, unknown>[]) {
        mode = 'insert';
        insertedRows = rows;
        seen(table).insert.push(rows);
        return builder;
      },
      // approval_stages insert echoes generated ids per row (by sequence).
      select() {
        const data = insertedRows.map((r) => ({
          id: stageIdFor(r.sequence as number),
          sequence: r.sequence,
        }));
        return Promise.resolve({ data, error: null });
      },
      then(resolve: (v: unknown) => unknown) {
        // Terminal await for delete / child inserts (no .select()).
        void mode;
        return Promise.resolve({ data: null, error: null }).then(resolve);
      },
    };
    return builder;
  }

  const from = vi.fn((table: string) => builderFor(table));
  return { supabase: { from } as unknown as ServerSupabase, calls };
}

describe('saveApprovalStages', () => {
  it('deletes the existing route, inserts stages in order, and fans out children', async () => {
    const { supabase, calls } = makeSupabase();

    const result = await saveApprovalStages(supabase, BILL_ID, {
      stages: [
        { roles: ['admin'], user_ids: [] },
        { roles: [], user_ids: [USER_ID] },
      ],
    });

    // The bill's existing route is cleared first (children cascade off this).
    expect(calls.approval_stages.delete).toBe(1);
    expect(calls.approval_stages.deleteEq).toContainEqual(['bill_id', BILL_ID]);

    // Stage parents insert with 1-based sequence from array position.
    expect(calls.approval_stages.insert[0]).toEqual([
      { bill_id: BILL_ID, sequence: 1 },
      { bill_id: BILL_ID, sequence: 2 },
    ]);

    // Role/user picks fan out to the child tables keyed by the echoed stage id.
    expect(calls.approval_stage_roles.insert[0]).toEqual([
      { stage_id: stageIdFor(1), role: 'admin' },
    ]);
    expect(calls.approval_stage_users.insert[0]).toEqual([
      { stage_id: stageIdFor(2), user_id: USER_ID },
    ]);

    // The returned model echoes server ids + sequence and validates.
    expect(result).toEqual([
      { id: stageIdFor(1), bill_id: BILL_ID, sequence: 1, roles: ['admin'], user_ids: [] },
      { id: stageIdFor(2), bill_id: BILL_ID, sequence: 2, roles: [], user_ids: [USER_ID] },
    ]);
  });

  it('clears the route and returns [] for an empty chain without inserting', async () => {
    const { supabase, calls } = makeSupabase();

    const result = await saveApprovalStages(supabase, BILL_ID, { stages: [] });

    expect(result).toEqual([]);
    expect(calls.approval_stages.delete).toBe(1);
    // No inserts at all when the chain is emptied.
    expect(calls.approval_stages.insert).toHaveLength(0);
    expect(calls.approval_stage_roles).toBeUndefined();
    expect(calls.approval_stage_users).toBeUndefined();
  });

  it('skips the child insert when a stage has only roles (no users) and vice-versa', async () => {
    const { supabase, calls } = makeSupabase();

    await saveApprovalStages(supabase, BILL_ID, {
      stages: [{ roles: ['accounts_payable'], user_ids: [] }],
    });

    expect(calls.approval_stage_roles.insert[0]).toEqual([
      { stage_id: stageIdFor(1), role: 'accounts_payable' },
    ]);
    // No users on any stage → the users child table is never touched.
    expect(calls.approval_stage_users).toBeUndefined();
  });
});
