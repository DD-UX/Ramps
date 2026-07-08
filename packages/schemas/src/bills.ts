import { z } from 'zod';

import { ApprovalStageSchema } from './approvals.js';
import { CurrencyCodeSchema, IdSchema, IsoDateSchema, MoneyCentsSchema } from './primitives.js';

/**
 * Bills — the OBLIGATION side of the bill/payment split (ANALYSIS §1
 * insight 1). The lifecycle is a state machine and the whole IA mirrors it
 * (insight 2); transitions are validated server-side against the map below,
 * illegal moves get a 422 (§4 design notes).
 */

export const BillStatusSchema = z.enum([
  'draft',
  'missing_info',
  'awaiting_approval',
  'approved',
  'scheduled',
  'partially_paid',
  'paid',
  'rejected',
  'archived',
]);
export type BillStatusType = z.infer<typeof BillStatusSchema>;

/**
 * The allowed-transitions map — the single source of truth for
 * `transitionBill()` (ANALYSIS §4). Notable edges:
 *  - `awaiting_approval → missing_info`: an approver sends a bill back.
 *  - `scheduled → approved`: the payment FAILED; the bill returns to the
 *    payable pool so a new payment can be scheduled (payments never resurrect).
 *  - `rejected → draft`: resubmission after rejection.
 *  - `archived` is terminal.
 */
export const BILL_STATUS_TRANSITIONS: Record<BillStatusType, readonly BillStatusType[]> = {
  draft: ['missing_info', 'awaiting_approval', 'archived'],
  missing_info: ['awaiting_approval', 'archived'],
  awaiting_approval: ['approved', 'rejected', 'missing_info', 'archived'],
  approved: ['scheduled', 'archived'],
  scheduled: ['partially_paid', 'paid', 'approved'],
  partially_paid: ['paid'],
  paid: ['archived'],
  rejected: ['draft', 'archived'],
  archived: [],
};

/** Is `from → to` a legal lifecycle move? (Server guards call this.) */
export function canTransitionBill(from: BillStatusType, to: BillStatusType): boolean {
  return BILL_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * How the bill entered the system (product-overview findings §3): the video
 * shows FOUR ingestion doors — forward to an `…@bill.ramp.com` address
 * ("Recommended"), drag-and-drop upload, spreadsheet import, and manual entry.
 */
export const BillSourceSchema = z.enum(['email', 'upload', 'spreadsheet', 'manual']);
export type BillSourceType = z.infer<typeof BillSourceSchema>;

/**
 * Business entity — the "Create bill under" dropdown in the drawer (findings
 * §4). Multi-entity orgs file the same vendor's bills under different legal
 * entities; single-entity demos seed exactly one.
 */
export const EntitySchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
});
export type EntityType = z.infer<typeof EntitySchema>;

/**
 * Risk flags — the red ↳ annotation rows under a bill in the table (findings
 * §2): "Ramps identified $5,660.00 of overbilling for this invoice", "possible
 * duplicate of INV# 8960", fraud warnings. A flag optionally points at the
 * RELATED bill (the duplicate's original) — that reference is what the
 * `TableAnnotationLink` in the UI kit navigates to.
 */
export const BillFlagTypeSchema = z.enum(['overbilling', 'duplicate', 'fraud']);
export type BillFlagTypeType = z.infer<typeof BillFlagTypeSchema>;

export const BillFlagSchema = z.object({
  id: IdSchema,
  bill_id: IdSchema,
  type: BillFlagTypeSchema,
  /** The sentence the annotation row renders. */
  message: z.string().min(1),
  /** Duplicates point at the original bill; other flags may not. */
  related_bill_id: IdSchema.nullable(),
  /** Overbilling flags carry the disputed amount ($5,660.00 in the video). */
  amount_cents: MoneyCentsSchema.nullable(),
  /** A reviewer can wave a flag off; dismissed flags stop annotating. */
  dismissed: z.boolean(),
});
export type BillFlagType = z.infer<typeof BillFlagSchema>;

/**
 * Line items — coding lives at the LINE level, never the header (ANALYSIS §4,
 * Ramp-founded). One table, no separate GL-distribution entity: a SPLIT
 * replaces a line with N sibling lines tagged by `split_group_id`.
 */

/**
 * Ramp's one real line-type distinction: `expense` codes to a GL account
 * (+ dimensions); `item` references a product with qty/unit price. Never
 * mixed on one line.
 */
export const LineItemKindSchema = z.enum(['expense', 'item']);
export type LineItemKindType = z.infer<typeof LineItemKindSchema>;

/**
 * Who coded this line (findings §5): `ramp` renders the "Coded by Ramp"
 * badge (AI autocoding), `vendor_default` means the vendor's saved default
 * coding was applied, `user` means a human picked the values. Null = uncoded.
 */
export const CodingSourceSchema = z.enum(['ramp', 'vendor_default', 'user']);
export type CodingSourceType = z.infer<typeof CodingSourceSchema>;

export const BillLineItemSchema = z.object({
  id: IdSchema,
  bill_id: IdSchema,
  line_no: z.number().int().min(1),
  kind: LineItemKindSchema,
  description: z.string(),
  /** Item lines carry qty/unit price; expense lines leave them null. */
  qty: z.number().int().positive().nullable(),
  unit_price_cents: MoneyCentsSchema.nullable(),
  amount_cents: MoneyCentsSchema,
  // Accounting dimensions (the "Accounting X" dropdowns — see ./dimensions).
  gl_account_id: IdSchema.nullable(),
  department_id: IdSchema.nullable(),
  class_id: IdSchema.nullable(),
  location_id: IdSchema.nullable(),
  tax_code_id: IdSchema.nullable(),
  /** NetSuite-style custom segment value (findings §5's "Custom" column). */
  custom_dimension_id: IdSchema.nullable(),
  billable: z.boolean(),
  /** Who filled the dimensions in — drives the "Coded by Ramp" badge (§5). */
  coding_source: CodingSourceSchema.nullable(),
  /** Split provenance: children of a split share the replaced row's group. */
  split_group_id: IdSchema.nullable(),
});
export type BillLineItemType = z.infer<typeof BillLineItemSchema>;

export const BillSchema = z.object({
  id: IdSchema,
  /**
   * Nullable on purpose: the email door (§3) lands drafts before anyone has
   * matched a vendor — that's exactly what the `missing_info` status is for.
   * The submit transition (not the schema) requires a vendor to proceed.
   */
  vendor_id: IdSchema.nullable(),
  /** "Create bill under" — the legal entity the bill files to (§4). */
  entity_id: IdSchema.nullable(),
  created_by: IdSchema,
  /** Which ingestion door the bill came through (§3). */
  source: BillSourceSchema,
  invoice_number: z.string().nullable(),
  invoice_date: IsoDateSchema.nullable(),
  due_date: IsoDateSchema.nullable(),
  /** The period the expense books to — distinct from the invoice date (§4). */
  accounting_date: IsoDateSchema.nullable(),
  /** Matching purchase order, when procurement raised one first (§4). */
  po_number: z.string().nullable(),
  amount_cents: MoneyCentsSchema,
  currency: CurrencyCodeSchema,
  memo: z.string().nullable(),
  /** Storage path/URL of the uploaded invoice document. */
  document_url: z.string().nullable(),
  status: BillStatusSchema,
});
export type BillType = z.infer<typeof BillSchema>;

/** A bill with its lines — the shape the detail drawer works on. */
export const BillWithLineItemsSchema = BillSchema.extend({
  line_items: z.array(BillLineItemSchema),
  /** Undismissed flags render as red ↳ annotation rows in the tables (§2). */
  flags: z.array(BillFlagSchema).default([]),
});
export type BillWithLineItemsType = z.infer<typeof BillWithLineItemsSchema>;

/**
 * A row of the Bill Pay TABLE — the shape that crosses the `/api/bills`
 * boundary (findings §1: the table is the product's spine). It's the bill
 * header the list actually renders, denormalized just enough to draw a row
 * without a second round-trip:
 *   - `vendor_name` — the joined vendor label (null on email-ingested drafts
 *     that arrived before a vendor was matched — the `missing_info` case).
 *   - `flags` — the UNDISMISSED risk flags only; they render as the red ↳
 *     annotation rows beneath the row (§2). Dismissed flags never reach here.
 * Line items are intentionally omitted — those load with the detail drawer
 * (BillWithLineItemsSchema), not the list.
 */
export const BillListItemSchema = BillSchema.extend({
  vendor_name: z.string().nullable(),
  flags: z.array(BillFlagSchema).default([]),
});
export type BillListItemType = z.infer<typeof BillListItemSchema>;

/** The `/api/bills` response envelope — the list plus its total count. */
export const BillListResponseSchema = z.object({
  bills: z.array(BillListItemSchema),
  /** Total rows matching the query, before any pagination window. */
  total: z.number().int().nonnegative(),
});
export type BillListResponseType = z.infer<typeof BillListResponseSchema>;

/** Line-item input while drafting (ids/line numbers are the server's job). */
export const BillLineItemCreateSchema = BillLineItemSchema.omit({
  id: true,
  bill_id: true,
  line_no: true,
})
  .partial({
    qty: true,
    unit_price_cents: true,
    gl_account_id: true,
    department_id: true,
    class_id: true,
    location_id: true,
    tax_code_id: true,
    custom_dimension_id: true,
    coding_source: true,
    split_group_id: true,
  })
  .extend({
    billable: z.boolean().default(false),
  });
export type BillLineItemCreateType = z.infer<typeof BillLineItemCreateSchema>;

/** Input for creating a bill (upload/OCR prefill → confirm form). */
export const BillCreateSchema = z.object({
  /** Optional at creation — email-ingested drafts arrive vendor-less (§3). */
  vendor_id: IdSchema.optional(),
  entity_id: IdSchema.optional(),
  source: BillSourceSchema.default('manual'),
  invoice_number: z.string().optional(),
  invoice_date: IsoDateSchema.optional(),
  due_date: IsoDateSchema.optional(),
  accounting_date: IsoDateSchema.optional(),
  po_number: z.string().optional(),
  amount_cents: MoneyCentsSchema.positive(),
  currency: CurrencyCodeSchema.default('USD'),
  memo: z.string().optional(),
  document_url: z.string().optional(),
  line_items: z.array(BillLineItemCreateSchema).default([]),
});
export type BillCreateType = z.infer<typeof BillCreateSchema>;

/** Patchable draft fields — status moves ONLY through `transitionBill()`. */
export const BillUpdateSchema = BillCreateSchema.omit({ line_items: true }).partial();
export type BillUpdateType = z.infer<typeof BillUpdateSchema>;

/* ────────────────────────────────────────────────────────────────────────
 * Bill DETAIL page (`/bills/[id]`) — the full editable record + edit-form scope
 *
 * The list crosses the wire as `BillListItemSchema` (header + vendor label +
 * flags). The detail PAGE needs more: the line items, the approval chain with
 * approver labels, the entity label, and the AI pre-review. These extend the
 * existing schemas rather than redefine them — the header shape stays single-
 * sourced from `BillSchema`.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * One approval step, denormalized with its approver's display name — the
 * `1 · Hannah Smolinski · <role>` rows in the Approvals section (findings §7,
 * snapshot 10). The name is a join label the chain renders; the raw approval
 * row lives in {@link ApprovalSchema} (../approvals).
 */
export const BillApprovalStepSchema = z.object({
  id: IdSchema,
  approver_id: IdSchema,
  approver_name: z.string().nullable(),
  sequence: z.number().int().min(1),
  status: z.enum(['pending', 'approved', 'rejected']),
  comment: z.string().nullable(),
});
export type BillApprovalStepType = z.infer<typeof BillApprovalStepSchema>;

/**
 * The full bill record the detail page reads — a bill with its lines, flags,
 * the vendor/entity labels the form shows read-only, and the approval chain.
 * Every section on `/bills/[id]` projects some slice of this one object.
 */
export const BillDetailSchema = BillWithLineItemsSchema.extend({
  /** Joined vendor label (null on an unmatched `missing_info` draft). */
  vendor_name: z.string().nullable(),
  /** Joined "Create bill under" entity label. */
  entity_name: z.string().nullable(),
  /** The ordered approval chain with approver names (empty pre-submit). */
  approvals: z.array(BillApprovalStepSchema).default([]),
  /**
   * The editable approval ROUTE (stages of roles ∪ users) the ApprovalsWorkflow
   * renders — distinct from `approvals` (the materialized, status-bearing rows).
   * Empty until an author adds steps. (../approvals → ApprovalStageSchema.)
   */
  approval_stages: z.array(ApprovalStageSchema).default([]),
});
export type BillDetailType = z.infer<typeof BillDetailSchema>;

/**
 * The react-hook-form EDIT scope for the detail page — the subset of the bill
 * a reviewer actually edits in the draft form, plus the line-item grid. Status,
 * ids, source and provenance are NOT here: status moves through
 * `transitionBill()`, ids are the server's, and the form never rewrites them.
 *
 * This is the resolver schema (`zodResolver(BillEditFormSchema)`); it mirrors
 * the entity so validation can't drift, but relaxes the draft-blank fields to
 * `''`/null so an in-progress draft is a valid form state (the SUBMIT
 * transition — not the resolver — is what demands a vendor, a due date, etc.).
 */
export const BillEditLineItemSchema = z.object({
  /** Present for existing lines, absent for a freshly-added row. */
  id: IdSchema.nullable(),
  kind: LineItemKindSchema,
  description: z.string(),
  qty: z.number().int().positive().nullable(),
  unit_price_cents: MoneyCentsSchema.nullable(),
  amount_cents: MoneyCentsSchema,
  gl_account_id: IdSchema.nullable(),
  department_id: IdSchema.nullable(),
  class_id: IdSchema.nullable(),
  location_id: IdSchema.nullable(),
  tax_code_id: IdSchema.nullable(),
  custom_dimension_id: IdSchema.nullable(),
  billable: z.boolean(),
});
export type BillEditLineItemType = z.infer<typeof BillEditLineItemSchema>;

export const BillEditFormSchema = z.object({
  vendor_id: IdSchema.nullable(),
  entity_id: IdSchema.nullable(),
  invoice_number: z.string(),
  invoice_date: IsoDateSchema.nullable(),
  due_date: IsoDateSchema.nullable(),
  accounting_date: IsoDateSchema.nullable(),
  po_number: z.string(),
  amount_cents: MoneyCentsSchema,
  currency: CurrencyCodeSchema,
  memo: z.string(),
  line_items: z.array(BillEditLineItemSchema),
});
export type BillEditFormType = z.infer<typeof BillEditFormSchema>;
