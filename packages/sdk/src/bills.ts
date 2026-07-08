import {
  BillDetailSchema,
  type BillDetailType,
  BillListItemSchema,
  type BillListItemType,
  BillSaveSchema,
  type BillSaveType,
  type BillStatusType,
  canTransitionBill,
  type SchedulePaymentType,
} from '@ramps/schemas/bills';

import { addBusinessDays } from './arrival.js';
import { renderInvoicePdf } from './invoice-pdf.js';
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

/**
 * Rows per page for the Bill Pay list. The list screen paginates 10-to-10; the
 * SDK owns the default so the page loader and the footer read one constant
 * rather than each hardcoding `10`.
 */
export const BILLS_PAGE_SIZE = 10;

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
  /**
   * 1-based page to return. Omitted (or `< 1`) means the first page. Combined
   * with {@link ListBillsOptions.pageSize} it maps to a PostgREST `.range()`.
   */
  page?: number;
  /**
   * Rows per page. Omitted means no windowing at all (every matching row) —
   * callers that want the paginated list pass {@link BILLS_PAGE_SIZE}. The
   * returned `total` is always the FULL filtered count, not the page length,
   * so the footer's "X–Y of N" stays correct.
   */
  pageSize?: number;
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

  // Window to the requested page. Only when a positive `pageSize` is given —
  // omit it and the query returns every matching row (the pre-pagination
  // behaviour). `count: 'exact'` above still reports the FULL filtered total, so
  // `.range()` narrows the rows without touching the "of N" the footer shows.
  if (options.pageSize && options.pageSize > 0) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const from = (page - 1) * options.pageSize;
    query = query.range(from, from + options.pageSize - 1);
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
 *  - `approval_stages(*, roles, users)` — the editable ROUTE (roles ∪ users per
 *    step) the ApprovalsWorkflow renders, embedded via the stage's child tables.
 */
const BILL_DETAIL_SELECT = `
  id, vendor_id, entity_id, created_by, source,
  invoice_number, invoice_date, due_date, accounting_date, po_number,
  amount_cents, currency, memo, document_url, status,
  vendors ( name ),
  entities ( name ),
  line_items:bill_line_items ( * ),
  flags:bill_flags!bill_flags_bill_id_fkey ( id, bill_id, type, message, related_bill_id, amount_cents, dismissed ),
  approvals ( id, approver_id, sequence, status, comment, approver:users!approvals_approver_id_fkey ( name ) ),
  approval_stages ( id, bill_id, sequence, roles:approval_stage_roles ( role ), users:approval_stage_users ( user_id ) ),
  payments ( id, bill_id, method, account_id, amount_cents, scheduled_date, arrival_date, batch_id, status, failure_reason )
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
  approval_stages: {
    id: string;
    bill_id: string;
    sequence: number;
    roles: { role: string }[];
    users: { user_id: string }[];
  }[];
  /** The bill's payment rows — we keep the most recent as `payment` (§6). */
  payments: unknown[];
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
  const { vendors, entities, line_items, approvals, approval_stages, payments, ...bill } = row;

  // The detail page shows ONE payment (the current schedule). A bill has at
  // most one live payment in this flow, but a failed→rescheduled bill could
  // have several rows — keep the latest by scheduled_date so "View schedule"
  // reads the one in force. Null when the bill was never scheduled.
  const latestPayment =
    [...(payments as { scheduled_date: string }[])].sort((a, b) =>
      a.scheduled_date < b.scheduled_date ? 1 : -1,
    )[0] ?? null;

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
    // Collapse each stage's role/user child rows to flat arrays; schema guards
    // the shape (an all-empty stage can't exist — the DB never writes one).
    approval_stages: [...approval_stages]
      .sort((a, b) => a.sequence - b.sequence)
      .map((stage) => ({
        id: stage.id,
        bill_id: stage.bill_id,
        sequence: stage.sequence,
        roles: stage.roles.map((r) => r.role),
        user_ids: stage.users.map((u) => u.user_id),
      })),
    payment: latestPayment,
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

/* ────────────────────────────────────────────────────────────────────────
 * WRITES — Save draft (the whole edit form) and Create bill (save + submit)
 * ──────────────────────────────────────────────────────────────────────── */

/** A blank text field arrives as `''` from the form; store it as SQL NULL. */
function emptyToNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

/**
 * BillNotEditableError — the caller sent a save/submit for a bill whose status
 * has locked its record (anything outside {@link BILL_EDITABLE_STATUSES} — i.e.
 * `approved` onward). The route maps this to a 409 so a stale client can't
 * rewrite a frozen bill. A named class so the handler can branch on it without
 * string-matching the message.
 */
export class BillNotEditableError extends Error {
  constructor(status: BillStatusType) {
    super(`This bill is no longer editable (status: ${status}).`);
    this.name = 'BillNotEditableError';
  }
}

/**
 * The statuses whose record still accepts a `saveBill` write. Wider than the
 * PRE-SUBMIT window (`draft`/`missing_info`): a bill in `awaiting_approval` is
 * still being shaped, so its header + lines stay editable while it sits in the
 * queue. Everything from `approved` onward — the payment pipeline and the
 * terminal states — is a frozen record: `approved`, `scheduled`,
 * `partially_paid`, `paid`, `rejected`, `archived`. This one set backs both the
 * SDK guard here and the client's edit affordance, so the two can't drift.
 */
export const BILL_EDITABLE_STATUSES: readonly BillStatusType[] = [
  'draft',
  'missing_info',
  'awaiting_approval',
];

/** True while the bill's record still accepts edits (see {@link BILL_EDITABLE_STATUSES}). */
export function isBillEditableStatus(status: BillStatusType): boolean {
  return BILL_EDITABLE_STATUSES.includes(status);
}

/**
 * Persist the WHOLE edit form for a pre-submit bill — the single definition of
 * "save this bill", shared by Save draft and (as its first half) Create bill.
 *
 * Two writes, in order:
 *  1. UPDATE the bill's header columns from the form's flat fields (blank text
 *     → NULL, so an emptied invoice number clears rather than stores `''`).
 *  2. REPLACE-ALL the line items: delete every existing line for the bill, then
 *     re-insert the form's array in order with `line_no = index + 1`. Same
 *     pattern as `saveApprovalStages` — the grid always emits the full ordered
 *     list, so a delete-then-insert is the simplest correct write. The form's
 *     nullable line `id` isn't needed here: replace-all re-keys every row.
 *
 * Guarded: throws {@link BillNotEditableError} if the bill has moved past the
 * editable states (the route turns that into a 409). NOT a single DB
 * transaction (PostgREST has no multi-statement tx) — acceptable for this
 * demo's single-author flow, same caveat as the approvals write. Returns the
 * re-read bill so the caller reconciles against the server's own truth.
 */
export async function saveBill(
  supabase: ServerSupabase,
  billId: string,
  input: BillSaveType,
): Promise<BillDetailType> {
  const form = BillSaveSchema.parse(input);

  // Guard: refuse to write a bill whose status has frozen its record.
  const existing = await getBill(supabase, billId);
  if (!existing) throw toSdkError({ message: 'Bill not found', code: 'PGRST116' });
  if (!isBillEditableStatus(existing.status)) {
    throw new BillNotEditableError(existing.status);
  }

  // 1) Header columns. Blank strings become NULL; the nullable ids/dates pass
  //    through as-is (the form already holds `null` for an empty picker).
  const headerUpdate = await supabase
    .from('bills')
    .update({
      vendor_id: form.vendor_id,
      entity_id: form.entity_id,
      invoice_number: emptyToNull(form.invoice_number),
      invoice_date: form.invoice_date,
      due_date: form.due_date,
      accounting_date: form.accounting_date,
      po_number: emptyToNull(form.po_number),
      amount_cents: form.amount_cents,
      currency: form.currency,
      memo: emptyToNull(form.memo),
    })
    .eq('id', billId);
  if (headerUpdate.error) throw toSdkError(headerUpdate.error);

  // 2) Line items, replace-all in array order. Clear then re-insert.
  const del = await supabase.from('bill_line_items').delete().eq('bill_id', billId);
  if (del.error) throw toSdkError(del.error);

  if (form.line_items.length > 0) {
    const rows = form.line_items.map((line, index) => ({
      bill_id: billId,
      line_no: index + 1,
      kind: line.kind,
      description: line.description,
      qty: line.qty,
      unit_price_cents: line.unit_price_cents,
      amount_cents: line.amount_cents,
      gl_account_id: line.gl_account_id,
      department_id: line.department_id,
      class_id: line.class_id,
      location_id: line.location_id,
      tax_code_id: line.tax_code_id,
      custom_dimension_id: line.custom_dimension_id,
      billable: line.billable,
    }));
    const ins = await supabase.from('bill_line_items').insert(rows);
    if (ins.error) throw toSdkError(ins.error);
  }

  // Re-read: the schema is the boundary guard and the client gets fresh ids.
  const saved = await getBill(supabase, billId);
  if (!saved) throw toSdkError({ message: 'Bill vanished after save', code: 'PGRST116' });
  return saved;
}

/**
 * Create bill — save the whole form, THEN submit it for approval. A strict
 * superset of {@link saveBill}: same persistence, plus the one lifecycle move
 * `draft`/`missing_info` → `awaiting_approval`, validated against the
 * transition map (`canTransitionBill`) so an illegal move can't sneak through.
 * Returns the re-read bill now carrying `awaiting_approval`.
 */
export async function submitBill(
  supabase: ServerSupabase,
  billId: string,
  input: BillSaveType,
): Promise<BillDetailType> {
  // Persist first — `saveBill` also runs the editable-status guard for us.
  const saved = await saveBill(supabase, billId, input);

  // The one transition: authoring → awaiting approval. Guard against the map so
  // this stays a legal move even if the states list grows.
  if (!canTransitionBill(saved.status, 'awaiting_approval')) {
    throw new BillNotEditableError(saved.status);
  }

  const move = await supabase
    .from('bills')
    .update({ status: 'awaiting_approval' })
    .eq('id', billId);
  if (move.error) throw toSdkError(move.error);

  const submitted = await getBill(supabase, billId);
  if (!submitted) throw toSdkError({ message: 'Bill vanished after submit', code: 'PGRST116' });
  return submitted;
}

/* ────────────────────────────────────────────────────────────────────────
 * APPROVE + SCHEDULE — the payment side of the lifecycle
 *
 * Approve advances a bill out of the approval queue. Schedule payment books the
 * money movement. Both write a `payments` row (ACH, the bill's amount, arrival
 * = scheduled + 2 business days) and move the bill to `scheduled`; Approve can
 * ALSO land on `approved` when no schedule rides along. Every transition is
 * guarded against the map, so an out-of-lifecycle move raises
 * {@link BillNotEditableError} → 409, same as the save/submit writes.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Book a `payments` row for a bill: ACH rail, the bill's own amount, arrival
 * derived from the scheduled date ("2 business days"), status `scheduled`. The
 * shared write behind both Approve-with-schedule and Schedule payment — neither
 * caller repeats the arrival math or the ACH/amount defaults.
 */
async function insertScheduledPayment(
  supabase: ServerSupabase,
  bill: BillDetailType,
  schedule: SchedulePaymentType,
): Promise<void> {
  const payment = await supabase.from('payments').insert({
    bill_id: bill.id,
    method: 'ach',
    account_id: schedule.account_id,
    amount_cents: bill.amount_cents,
    scheduled_date: schedule.scheduled_date,
    arrival_date: addBusinessDays(schedule.scheduled_date),
    status: 'scheduled',
  });
  if (payment.error) throw toSdkError(payment.error);
}

/**
 * Approve bill — persist any last edits (Approve is offered while the bill is
 * still `awaiting_approval`, which is editable), then advance it. Two exits,
 * per whether COMPLETE payment details rode along:
 *  - `schedule` present → book the payment and move `→ scheduled` in one step.
 *  - `schedule` omitted → move `→ approved`; scheduling is a later step.
 *
 * Guarded: `saveBill` runs the editable-status guard, and the target move is
 * checked against `canTransitionBill`, so a bill already past the queue raises
 * {@link BillNotEditableError} (→ 409). Returns the re-read bill in its new state.
 */
export async function approveBill(
  supabase: ServerSupabase,
  billId: string,
  input: BillSaveType,
  schedule?: SchedulePaymentType | null,
): Promise<BillDetailType> {
  // Persist the form first — same as submit. This also runs the editable guard.
  const saved = await saveBill(supabase, billId, input);

  // With complete payment details, approval books the payment and jumps to
  // `scheduled`; otherwise it stops at `approved`. Guard the chosen edge.
  const target: BillStatusType = schedule ? 'scheduled' : 'approved';

  // `scheduled` isn't a direct successor of `awaiting_approval` (the map routes
  // it through `approved`), so a schedule-at-approve moves in two guarded hops.
  if (!canTransitionBill(saved.status, 'approved')) {
    throw new BillNotEditableError(saved.status);
  }

  const approve = await supabase.from('bills').update({ status: 'approved' }).eq('id', billId);
  if (approve.error) throw toSdkError(approve.error);

  if (schedule) {
    await insertScheduledPayment(supabase, saved, schedule);
    const move = await supabase.from('bills').update({ status: target }).eq('id', billId);
    if (move.error) throw toSdkError(move.error);
  }

  const approved = await getBill(supabase, billId);
  if (!approved) throw toSdkError({ message: 'Bill vanished after approve', code: 'PGRST116' });
  return approved;
}

/**
 * Schedule payment — book the money movement for an already-`approved` bill.
 * Inserts the `payments` row and moves `approved → scheduled`. Guarded against
 * the transition map: a bill not sitting on `approved` raises
 * {@link BillNotEditableError} (→ 409). Returns the re-read `scheduled` bill,
 * now carrying its `payment` for the read-only "View schedule" modal.
 */
export async function schedulePayment(
  supabase: ServerSupabase,
  billId: string,
  schedule: SchedulePaymentType,
): Promise<BillDetailType> {
  const existing = await getBill(supabase, billId);
  if (!existing) throw toSdkError({ message: 'Bill not found', code: 'PGRST116' });

  if (!canTransitionBill(existing.status, 'scheduled')) {
    throw new BillNotEditableError(existing.status);
  }

  await insertScheduledPayment(supabase, existing, schedule);

  const move = await supabase.from('bills').update({ status: 'scheduled' }).eq('id', billId);
  if (move.error) throw toSdkError(move.error);

  const scheduled = await getBill(supabase, billId);
  if (!scheduled) throw toSdkError({ message: 'Bill vanished after schedule', code: 'PGRST116' });
  return scheduled;
}

/**
 * Complete payment ("roll it now") — release a `scheduled` bill's payment
 * immediately instead of waiting for its scheduled date. Moves the bill
 * `scheduled → paid` and settles its live payment row: status `paid`, and both
 * `scheduled_date` + `arrival_date` pulled to TODAY (the money moves now, so it
 * lands now — no 2-day ACH wait). A demo shortcut past the simulator's
 * `initiated` step; the end state is what a released payment looks like.
 *
 * Guarded against the transition map: a bill not sitting on `scheduled` raises
 * {@link BillNotEditableError} (→ 409). Returns the re-read `paid` bill.
 */
export async function rollPaymentNow(
  supabase: ServerSupabase,
  billId: string,
): Promise<BillDetailType> {
  const existing = await getBill(supabase, billId);
  if (!existing) throw toSdkError({ message: 'Bill not found', code: 'PGRST116' });

  if (!canTransitionBill(existing.status, 'paid')) {
    throw new BillNotEditableError(existing.status);
  }

  // The live payment row is what "View schedule" reads; settle THAT one so the
  // paid bill carries a paid payment rather than a stale scheduled stub.
  if (!existing.payment) {
    throw toSdkError({ message: 'No scheduled payment to complete', code: 'PGRST116' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const settle = await supabase
    .from('payments')
    .update({ status: 'paid', scheduled_date: today, arrival_date: today })
    .eq('id', existing.payment.id);
  if (settle.error) throw toSdkError(settle.error);

  const move = await supabase.from('bills').update({ status: 'paid' }).eq('id', billId);
  if (move.error) throw toSdkError(move.error);

  const paid = await getBill(supabase, billId);
  if (!paid) throw toSdkError({ message: 'Bill vanished after roll', code: 'PGRST116' });
  return paid;
}

/* ────────────────────────────────────────────────────────────────────────
 * CREATE A BILL — the demo "give me another bill to test with" generator
 *
 * The Bill Pay empty state offers "Create your first bill"; this is its always-
 * available sibling for people kicking the tyres. One click mints a brand-new,
 * believable bill so a tester never runs out of things to code, approve, and
 * schedule. It is DEMO scaffolding, not a product write path — the real
 * ingestion doors (email/upload/spreadsheet/manual) land bills the user's own
 * way; this one fabricates a plausible one server-side so there's no data entry.
 * ──────────────────────────────────────────────────────────────────────── */

/** The Storage bucket the generated invoice PDF lands in (public, per the seed). */
const INVOICE_BUCKET = 'invoices';

/** Pick one element of a non-empty array at random. */
function pickOne<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

/** A random integer in [min, max]. */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** ISO `YYYY-MM-DD` for `today + offsetDays` (UTC). */
function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** A believable invoice-number stem from a vendor name (letters, upper, >=3). */
function vendorStem(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (letters.slice(0, 4) || 'INV').padEnd(3, 'X');
}

/**
 * The catalog rows `createDemoBill` draws from — the seeded vendors, entities,
 * users, and a couple of coding dimensions. Fetched live (never hardcoded) so
 * the generator follows whatever the DB actually holds.
 */
interface DemoCatalog {
  vendors: { id: string; name: string }[];
  entities: { id: string }[];
  users: { id: string }[];
  glAccounts: { id: string }[];
  departments: { id: string }[];
}

async function loadDemoCatalog(supabase: ServerSupabase): Promise<DemoCatalog> {
  const [vendors, entities, users, glAccounts, departments] = await Promise.all([
    supabase.from('vendors').select('id, name').eq('status', 'active'),
    supabase.from('entities').select('id'),
    supabase.from('users').select('id').in('role', ['accounts_payable', 'admin']),
    supabase.from('gl_accounts').select('id').eq('active', true),
    supabase.from('departments').select('id').eq('active', true),
  ]);

  for (const res of [vendors, entities, users, glAccounts, departments]) {
    if (res.error) throw toSdkError(res.error);
  }

  const catalog: DemoCatalog = {
    vendors: (vendors.data ?? []) as DemoCatalog['vendors'],
    entities: (entities.data ?? []) as DemoCatalog['entities'],
    users: (users.data ?? []) as DemoCatalog['users'],
    glAccounts: (glAccounts.data ?? []) as DemoCatalog['glAccounts'],
    departments: (departments.data ?? []) as DemoCatalog['departments'],
  };

  // `created_by` is a NOT NULL FK — without at least one user we cannot mint a
  // bill. The other lists degrade gracefully (a vendor-less missing_info draft
  // is legal; lines can go uncoded), so only the user is a hard requirement.
  if (catalog.users.length === 0) {
    throw toSdkError({ message: 'No AP/admin user to author a demo bill', code: 'PGRST116' });
  }
  return catalog;
}

/** A couple of plausible expense descriptions for the generated line items. */
const DEMO_LINE_DESCRIPTIONS = [
  'Professional services',
  'Software subscription',
  'Office supplies',
  'Marketing services',
  'Consulting retainer',
  'Equipment rental',
] as const;

const DEMO_MEMOS = [
  'Monthly service invoice',
  'Quarterly retainer',
  'Project milestone billing',
  'Recurring subscription',
] as const;

/**
 * Generate ONE brand-new demo bill, complete with a rendered invoice document.
 *
 * What it fabricates:
 *  - a random `draft` or `missing_info` status. The `missing_info` variant keeps
 *    a deliberately SPARSE row (no vendor, no dates) — that incompleteness is
 *    the state's whole point — while its PDF is still drawn complete, exactly
 *    like the seed's overrides: a real vendor never mails a blank page.
 *  - random real vendor / entity / author / coding pulled from the live catalog.
 *  - 1-2 line items summing to the header amount.
 *  - a PO number ~50% of the time and null otherwise — so a tester exercises the
 *    optional field both ways without hunting for the right seed row.
 *
 * Then it draws the invoice PDF from the COMPLETE document (see
 * {@link renderInvoicePdf}), uploads it to the public `invoices` bucket at
 * `<bill_id>.pdf`, and backfills `bills.document_url` so `/bills/[id]` shows the
 * document side-by-side with the form. Returns the re-read {@link BillDetailType}
 * so the caller can route straight into the new bill.
 */
export async function createDemoBill(supabase: ServerSupabase): Promise<BillDetailType> {
  const catalog = await loadDemoCatalog(supabase);

  // Coin flips that shape the bill: which lifecycle state, and whether a PO
  // rides along (the optional-field test). A missing_info draft is the email
  // door's vendor-less arrival, so it hides the vendor + dates from the ROW.
  const status: BillStatusType = Math.random() < 0.5 ? 'draft' : 'missing_info';
  const isMissingInfo = status === 'missing_info';
  const withPo = Math.random() < 0.5;

  const vendor = catalog.vendors.length > 0 ? pickOne(catalog.vendors) : null;
  const author = pickOne(catalog.users);
  const stem = vendor ? vendorStem(vendor.name) : 'INV';
  const invoiceNumber = `${stem}-${randomInt(1000, 9999)}`;
  const poNumber = withPo ? `PO-${randomInt(1000, 9999)}` : null;
  const memo = pickOne(DEMO_MEMOS);

  // 1-2 line items whose amounts define the header total (money is cents).
  const lineCount = randomInt(1, 2);
  const lines = Array.from({ length: lineCount }, () => ({
    description: pickOne(DEMO_LINE_DESCRIPTIONS),
    amount_cents: randomInt(5, 500) * 1000, // $50-$5,000, whole dollars
  }));
  const amountCents = lines.reduce((sum, l) => sum + l.amount_cents, 0);

  const invoiceDate = isoDay(-randomInt(1, 20));
  const dueDate = isoDay(randomInt(14, 45));

  // Header row. For missing_info we deliberately leave vendor + dates NULL so
  // the ROW reads as an unmatched, email-ingested draft; the PDF below is still
  // drawn from the complete values so the document itself never looks fake.
  const insertHeader = await supabase
    .from('bills')
    .insert({
      vendor_id: isMissingInfo ? null : (vendor?.id ?? null),
      entity_id: isMissingInfo ? null : (catalog.entities[0]?.id ?? null),
      created_by: author.id,
      source: isMissingInfo ? 'email' : 'manual',
      invoice_number: isMissingInfo ? null : invoiceNumber,
      invoice_date: isMissingInfo ? null : invoiceDate,
      due_date: isMissingInfo ? null : dueDate,
      accounting_date: null,
      po_number: isMissingInfo ? null : poNumber,
      amount_cents: amountCents,
      currency: 'USD',
      memo,
      document_url: null,
      status,
    })
    .select('id')
    .single();
  if (insertHeader.error) throw toSdkError(insertHeader.error);

  const billId = (insertHeader.data as { id: string }).id;

  // Line items. A draft codes them against a real GL account + department; a
  // missing_info row leaves them uncoded (the reviewer will code on match).
  const glAccountId = catalog.glAccounts[0]?.id ?? null;
  const departmentId = catalog.departments[0]?.id ?? null;
  const lineRows = lines.map((line, index) => ({
    bill_id: billId,
    line_no: index + 1,
    kind: 'expense' as const,
    description: line.description,
    qty: null,
    unit_price_cents: null,
    amount_cents: line.amount_cents,
    gl_account_id: isMissingInfo ? null : glAccountId,
    department_id: isMissingInfo ? null : departmentId,
    class_id: null,
    location_id: null,
    tax_code_id: null,
    custom_dimension_id: null,
    billable: false,
    coding_source: isMissingInfo ? null : ('user' as const),
  }));
  const insertLines = await supabase.from('bill_line_items').insert(lineRows);
  if (insertLines.error) throw toSdkError(insertLines.error);

  // Render the invoice PDF from the COMPLETE document (never the sparse row),
  // upload it, and backfill document_url so /bills/[id] shows the document. A
  // failed upload shouldn't orphan a valid bill, so we only backfill on success.
  const pdfBytes = await renderInvoicePdf({
    vendor_name: vendor?.name ?? 'Acme Supply Co.',
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    due_date: dueDate,
    po_number: poNumber,
    amount_cents: amountCents,
    currency: 'USD',
    memo,
    line_items: lines.map((line) => ({
      description: line.description,
      qty: null,
      unit_price_cents: null,
      amount_cents: line.amount_cents,
    })),
  });

  const path = `${billId}.pdf`;
  const upload = await supabase.storage
    .from(INVOICE_BUCKET)
    .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (!upload.error) {
    const backfill = await supabase
      .from('bills')
      .update({ document_url: `${INVOICE_BUCKET}/${path}` })
      .eq('id', billId);
    if (backfill.error) throw toSdkError(backfill.error);
  }

  const created = await getBill(supabase, billId);
  if (!created) throw toSdkError({ message: 'Bill vanished after create', code: 'PGRST116' });
  return created;
}
