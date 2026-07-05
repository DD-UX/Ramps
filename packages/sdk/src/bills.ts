import {
  BillListItemSchema,
  type BillListItemType,
  type BillStatusType,
} from '@ramps/schemas/bills';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk bills facade — the API→DB contract for the Bill Pay table.
 *
 * One responsibility: turn the `bills` table (plus the vendor label and the
 * undismissed risk flags) into validated `BillListItemType` rows. It owns the
 * query and the snake_case boundary; callers (the `/api/bills` route handler)
 * get parsed models back, never raw PostgREST JSON.
 *
 * Inspired by KarmaPlus's resource facades, re-grained: instead of a hand
 * `rowToBill` mapper into a bespoke interface, the join is shaped to match the
 * zod schema and `BillListItemSchema.parse` does the validation — the schema
 * is the single source of truth, so there's no second type to drift from it.
 */

/**
 * The PostgREST select. `vendors(name)` embeds the joined vendor as a nested
 * object (null when `vendor_id` is null — the email-ingested `missing_info`
 * draft).
 *
 * `bill_flags` has TWO foreign keys back to `bills` — `bill_id` (the flag's
 * owner) and `related_bill_id` (the duplicate's original) — so PostgREST can't
 * guess which relationship to embed and 400s with PGRST201. We disambiguate by
 * naming the constraint: `!bill_flags_bill_id_fkey` embeds on the OWNER edge,
 * which is the one the table renders. We keep only the undismissed flags (the
 * red ↳ annotation rows) via the embedded filter below.
 */
const BILL_LIST_SELECT = `
  id, vendor_id, entity_id, created_by, source,
  invoice_number, invoice_date, due_date, accounting_date, po_number,
  amount_cents, currency, memo, document_url, status,
  vendors ( name ),
  flags:bill_flags!bill_flags_bill_id_fkey ( id, bill_id, type, message, related_bill_id, amount_cents, dismissed )
` as const;

/** The row shape PostgREST returns for {@link BILL_LIST_SELECT}. */
interface BillListRow {
  id: string;
  vendor_id: string | null;
  entity_id: string | null;
  created_by: string;
  source: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  accounting_date: string | null;
  po_number: string | null;
  amount_cents: number;
  currency: string;
  memo: string | null;
  document_url: string | null;
  status: string;
  /** Embedded vendor — a single object or null (an FK-to-one embed). */
  vendors: { name: string } | null;
  /** Embedded flags — already filtered to the undismissed ones; parsed by schema. */
  flags: unknown[];
}

export interface ListBillsOptions {
  /** Restrict to a single lifecycle state (the active table tab). */
  status?: BillStatusType;
}

/**
 * List Bill Pay rows, newest due date first, optionally filtered to one
 * lifecycle state. Returns validated models + the total count for the tab.
 */
export async function listBills(
  supabase: ServerSupabase,
  options: ListBillsOptions = {},
): Promise<{ bills: BillListItemType[]; total: number }> {
  let query = supabase
    .from('bills')
    .select(BILL_LIST_SELECT, { count: 'exact' })
    // Only the undismissed flags reach the client (§2). The filter targets the
    // embed by its ALIAS (`flags`), matching the `flags:bill_flags…` select.
    .eq('flags.dismissed', false)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  const { data, error, count } = await query;
  if (error) throw toSdkError(error);

  const rows = (data ?? []) as unknown as BillListRow[];
  // Flatten the embedded vendor to `vendor_name`, then parse. The schema is
  // the boundary guard — a shape the DB shouldn't produce fails loudly here.
  const bills = rows.map((row) => {
    const { vendors, ...bill } = row;
    return BillListItemSchema.parse({
      ...bill,
      vendor_name: vendors?.name ?? null,
    });
  });

  return { bills, total: count ?? bills.length };
}

/**
 * Count bills per lifecycle state — the numbers behind the tab badges.
 *
 * One cheap `status`-only select (no joins, no flag filter) grouped in memory;
 * the tab bar needs all nine counts regardless of which tab is active, so this
 * runs once alongside {@link listBills}. Keys are {@link BillStatusType}; a
 * state with no bills is simply absent (the caller treats missing as 0).
 */
export async function countBillsByStatus(
  supabase: ServerSupabase,
): Promise<Partial<Record<BillStatusType, number>>> {
  const { data, error } = await supabase.from('bills').select('status');
  if (error) throw toSdkError(error);

  const rows = (data ?? []) as unknown as { status: BillStatusType }[];
  return rows.reduce<Partial<Record<BillStatusType, number>>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}
