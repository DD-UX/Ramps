import { z } from 'zod';

import { IdSchema, IsoDateTimeSchema } from './primitives.js';

/**
 * Activity events — the audit trail, from day one (ANALYSIS §4 design notes).
 * Powers the bill detail timeline; every state change, approval action and
 * payment movement writes a row. Append-only.
 */

export const ActivityEventTypeSchema = z.enum([
  'bill_created',
  'bill_updated',
  'bill_status_changed',
  'approval_requested',
  'approval_approved',
  'approval_rejected',
  'approver_added', // the in-flight chain edit (ANALYSIS §9.7)
  'payment_scheduled',
  'payment_initiated',
  'payment_paid',
  'payment_failed',
  'payment_batch_released', // bulk "Release payments" (findings §8)
  'bill_flagged', // fraud/duplicate/overbilling annotation raised (§2)
  'flag_dismissed',
  'coding_suggested', // the AI autocode pass — "Coded by Ramp" (§5)
  'default_coding_saved', // "Save as default coding for <vendor>" (§5)
  'context_added', // the Add-context feedback modal (§5)
  'virtual_card_created', // card rail: single-use card minted (§6)
  'virtual_card_locked', // …and locked after its one charge (§6)
  'comment_added',
  'reminder_sent',
]);
export type ActivityEventTypeType = z.infer<typeof ActivityEventTypeSchema>;

export const ActivityEventSchema = z.object({
  id: IdSchema,
  bill_id: IdSchema,
  /** Null actor = the system (simulators, phantom approvers). */
  actor_id: IdSchema.nullable(),
  type: ActivityEventTypeSchema,
  /** Event-specific details (old/new status, amounts, comments…). */
  payload: z.record(z.string(), z.unknown()),
  created_at: IsoDateTimeSchema,
});
export type ActivityEventType = z.infer<typeof ActivityEventSchema>;
