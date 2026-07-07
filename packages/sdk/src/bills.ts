import {
  BillDetailSchema,
  type BillDetailType,
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
  /**
   * Restrict to a set of lifecycle states — the active tab's status group (a
   * tab like "For payment" rolls up approved/scheduled/partially_paid). Empty
   * or omitted means the unfiltered Overview view.
   */
  statuses?: readonly BillStatusType[];
  /**
   * Free-text match for the toolbar's "Search or filter…" field. Case-insensitive
   * substring across the bill's own identifying columns — invoice number, PO
   * number, and memo (`col ILIKE %q%`, OR-combined). Trimmed empty / omitted
   * means no text filter. Typed off the entity so it can't drift from the row.
   */
  search?: BillListItemType['invoice_number'];
}

/**
 * Escape a raw search term for a PostgREST `or(...)` clause. Commas and
 * parentheses are the clause's own delimiters, so a term containing them would
 * break the filter grammar; we strip them rather than let a stray `)` 400 the
 * query. (`*` maps to the ILIKE wildcard, so we leave it alone — a user typing
 * `*` is a legitimate wildcard, not an injection vector against a parameterized
 * PostgREST filter.)
 */
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[(),]/g, ' ').trim();
}

/**
 * List Bill Pay rows, newest due date first, optionally filtered to the active
 * tab's status group. Returns validated models + the total count for the tab.
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

  // A tab's status group → `status IN (…)`. Empty group = Overview = no filter.
  if (options.statuses && options.statuses.length > 0) {
    query = query.in('status', options.statuses as BillStatusType[]);
  }

  // Toolbar free-text → `col ILIKE %term%` OR-combined across the bill's own
  // identifying columns. Sanitized (a blank term after stripping `(),` is a
  // no-op, so an all-punctuation search doesn't collapse to "match all").
  const term = options.search ? sanitizeSearchTerm(options.search) : '';
  if (term) {
    query = query.or(
      `invoice_number.ilike.%${term}%,po_number.ilike.%${term}%,memo.ilike.%${term}%`,
    );
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

/* ────────────────────────────────────────────────────────────────────────
 * Single bill — the `/bills/[id]` DETAIL read
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * The detail select. Beyond the header columns it embeds everything the
 * `/bills/[id]` page renders in one round-trip:
 *  - `vendors(name)` / `entities(name)` — the read-only labels the form shows.
 *  - `line_items(*)` — the coding grid, ordered by `line_no`.
 *  - undismissed `flags` — the red risk annotations (same OWNER-edge
 *    disambiguation as the list select, see {@link BILL_LIST_SELECT}).
 *  - `approvals(*, users(name))` — the ordered approval chain with approver
 *    labels; PostgREST embeds the approver via the `approver_id` FK.
 */
const BILL_DETAIL_SELECT = `
  id, vendor_id, entity_id, created_by, source,
  invoice_number, invoice_date, due_date, accounting_date, po_number,
  amount_cents, currency, memo, document_url, status,
  vendors ( name ),
  entities ( name ),
  line_items:bill_line_items ( * ),
  flags:bill_flags!bill_flags_bill_id_fkey ( id, bill_id, type, message, related_bill_id, amount_cents, dismissed ),
  approvals ( id, approver_id, sequence, status, comment, approver:users!approvals_approver_id_fkey ( name ) )
` as const;

/** The row shape PostgREST returns for {@link BILL_DETAIL_SELECT}. */
interface BillDetailRow {
  vendors: { name: string } | null;
  entities: { name: string } | null;
  line_items: { line_no: number }[];
  flags: unknown[];
  approvals: {
    id: string;
    approver_id: string;
    sequence: number;
    status: string;
    comment: string | null;
    approver: { name: string } | null;
  }[];
  [key: string]: unknown;
}

/**
 * Fetch one bill with everything the detail page edits — lines, flags, the
 * vendor/entity labels, and the approval chain. Returns `null` when no row
 * matches (the route turns that into a 404). Validated at the boundary against
 * {@link BillDetailSchema}, so every section downstream trusts the shape.
 */
export async function getBill(
  supabase: ServerSupabase,
  billId: string,
): Promise<BillDetailType | null> {
  const { data, error } = await supabase
    .from('bills')
    .select(BILL_DETAIL_SELECT)
    .eq('id', billId)
    .eq('flags.dismissed', false)
    .maybeSingle();

  if (error) throw toSdkError(error);
  if (!data) return null;

  const row = data as unknown as BillDetailRow;
  const { vendors, entities, line_items, approvals, ...bill } = row;

  // Flatten the joined labels, sort the lines by number, and lift the approver
  // name out of its embed — then let the schema guard the whole shape.
  return BillDetailSchema.parse({
    ...bill,
    vendor_name: vendors?.name ?? null,
    entity_name: entities?.name ?? null,
    line_items: [...line_items].sort((a, b) => a.line_no - b.line_no),
    approvals: approvals
      .map((step) => ({
        id: step.id,
        approver_id: step.approver_id,
        approver_name: step.approver?.name ?? null,
        sequence: step.sequence,
        status: step.status,
        comment: step.comment,
      }))
      .sort((a, b) => a.sequence - b.sequence),
  });
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
