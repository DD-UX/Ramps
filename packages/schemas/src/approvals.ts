import { z } from 'zod';

import { RoleSchema } from './policies.js';
import { IdSchema, IsoDateTimeSchema, MoneyCentsSchema } from './primitives.js';

/**
 * Approvals — policy-driven routing (ANALYSIS §1 insight 4, §9.7).
 *
 * Admins configure RULES once (`condition → approver`); on bill submit the
 * active rules are evaluated and materialized as per-bill `approvals` rows
 * (the chain). Rules are non-retroactive; an in-flight bill's chain can still
 * gain an approver (the "boom" mechanic). The Approvals tab is simply
 * `bills where an approval row names me AND status = pending`.
 */

/**
 * Dynamic approver targets — the video's "Send for review to" menu offers
 * **Vendor Owner** alongside concrete people and "Any Admin" (product-overview
 * findings §7). "Any Admin" is `approver_role: 'admin'`; "Vendor Owner"
 * resolves per-bill to `vendor.owner_id`, so it needs its own kind.
 */
export const ApprovalDynamicTargetSchema = z.enum(['vendor_owner']);
export type ApprovalDynamicTargetType = z.infer<typeof ApprovalDynamicTargetSchema>;

/**
 * An admin-configured routing rule. A step names a specific user OR a role
 * OR a dynamic target — exactly one (Ramp: the submitter never picks
 * approvers). `allow_self_approve` mirrors the video's "allow self-approval"
 * checkbox: when false, a step that resolves to the bill's submitter skips
 * to the next eligible approver.
 */
export const ApprovalPolicySchema = z
  .object({
    id: IdSchema,
    /** Routing condition: bills at or above this amount hit this step. */
    min_amount_cents: MoneyCentsSchema.min(0),
    approver_id: IdSchema.nullable(),
    approver_role: RoleSchema.nullable(),
    approver_dynamic: ApprovalDynamicTargetSchema.nullable(),
    allow_self_approve: z.boolean().default(false),
    /** Order of this step within the generated chain. */
    sequence: z.number().int().min(1),
  })
  .refine(
    (p) =>
      [p.approver_id, p.approver_role, p.approver_dynamic].filter((t) => t !== null)
        .length === 1,
    {
      message:
        'A policy step names exactly one of approver_id, approver_role or approver_dynamic',
    },
  );
export type ApprovalPolicyType = z.infer<typeof ApprovalPolicySchema>;

export const ApprovalStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type ApprovalStatusType = z.infer<typeof ApprovalStatusSchema>;

/** One materialized step of a bill's approval chain (the N-of-M counter). */
export const ApprovalSchema = z.object({
  id: IdSchema,
  bill_id: IdSchema,
  approver_id: IdSchema,
  sequence: z.number().int().min(1),
  status: ApprovalStatusSchema,
  comment: z.string().nullable(),
  acted_at: IsoDateTimeSchema.nullable(),
});
export type ApprovalType = z.infer<typeof ApprovalSchema>;

/**
 * The AI pre-review shown to approvers (findings §7): Ramp runs itemized
 * checks (amount vs. history, duplicate scan, coding completeness…) and
 * headlines either "Ready to approve" (all pass) or "Review recommended".
 * Stored per bill so the approval drawer replays exactly what the AI saw.
 */
export const BillReviewVerdictSchema = z.enum(['ready_to_approve', 'review_recommended']);
export type BillReviewVerdictType = z.infer<typeof BillReviewVerdictSchema>;

export const BillReviewCheckSchema = z.object({
  /** e.g. "Bill amount is similar to recent W.B. Mason bills". */
  label: z.string().min(1),
  passed: z.boolean(),
  /** Failure detail — the sentence under a failed check. */
  detail: z.string().nullable(),
});
export type BillReviewCheckType = z.infer<typeof BillReviewCheckSchema>;

export const BillReviewSchema = z
  .object({
    bill_id: IdSchema,
    verdict: BillReviewVerdictSchema,
    checks: z.array(BillReviewCheckSchema).min(1),
    created_at: IsoDateTimeSchema,
  })
  .refine(
    (r) => (r.verdict === 'ready_to_approve') === r.checks.every((c) => c.passed),
    { message: '"Ready to approve" if and only if every check passed' },
  );
export type BillReviewType = z.infer<typeof BillReviewSchema>;

/** Approve/reject input — rejection requires the courtesy of a comment. */
export const ApprovalActionSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    comment: z.string().optional(),
  })
  .refine((a) => a.status !== 'rejected' || (a.comment ?? '').trim().length > 0, {
    message: 'Rejecting a bill requires a comment',
  });
export type ApprovalActionType = z.infer<typeof ApprovalActionSchema>;
