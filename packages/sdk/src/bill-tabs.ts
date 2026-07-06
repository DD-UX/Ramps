import { BillTabSchema, type BillTabType } from '@ramps/schemas/bill-tabs';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk bill-tabs facade — the Bill Pay tab bar as data.
 *
 * The five product categories (Overview | Drafts | For approval | For payment |
 * History) live in the `bill_tabs` lookup table, not a hardcoded constant, so
 * the grouping — and, later, custom saved views — is a data change. This facade
 * reads that catalog and `.parse()`s each row against `BillTabSchema` (the
 * single Zod gate); callers get validated models, never raw PostgREST JSON.
 *
 * Framework-free by contract (see this package's AGENTS.md): a plain async
 * function, no React. The page reads it once per request and wraps it in
 * React `cache()` at the feature layer to dedupe across the filtered query and
 * the tab bar.
 */

/** All Bill Pay tabs, in display order. Validated rows from the lookup table. */
export async function listBillTabs(supabase: ServerSupabase): Promise<BillTabType[]> {
  const { data, error } = await supabase
    .from('bill_tabs')
    .select('id, name, code, statuses, sort_order, created_by')
    .order('sort_order', { ascending: true });

  if (error) throw toSdkError(error);

  // The schema is the boundary guard — a row the DB shouldn't produce (a bad
  // status in the array, a missing code) fails loudly here, not downstream.
  return (data ?? []).map((row) => BillTabSchema.parse(row));
}
