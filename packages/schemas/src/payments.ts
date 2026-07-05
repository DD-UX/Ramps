import { z } from 'zod';

import { IdSchema, IsoDateSchema, IsoDateTimeSchema, MoneyCentsSchema } from './primitives.js';

/**
 * Payments — a payment is a MONEY MOVEMENT, separate from the bill (the
 * obligation). One bill → one or more payments, each with an independent
 * status (ANALYSIS §1 insight 1, §4).
 */

/**
 * Payment rails (simulated — ANALYSIS §6). `card` is the Ramp-card rail from
 * product-overview findings §6: a single-use virtual card is minted for the
 * bill (see {@link VirtualCardSchema}); the other three move bank money.
 */
export const PaymentMethodSchema = z.enum(['ach', 'check', 'wire', 'card']);
export type PaymentMethodType = z.infer<typeof PaymentMethodSchema>;

/**
 * A pay-from bank account — the "Pay from" picker in the video shows each
 * account WITH its live balance (findings §6, "Checking •• 4821  $1.2M").
 * Balances are simulated but the shape is real.
 */
export const PaymentAccountSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  bank_name: z.string().min(1),
  account_number_masked: z.string().min(1),
  balance_cents: MoneyCentsSchema,
});
export type PaymentAccountType = z.infer<typeof PaymentAccountSchema>;

export const PaymentStatusSchema = z.enum(['scheduled', 'initiated', 'paid', 'failed']);
export type PaymentStatusType = z.infer<typeof PaymentStatusSchema>;

/**
 * The payment state machine the simulator walks (`scheduled → initiated →
 * paid`, with one seeded failure). `failed` is terminal — recovering is a NEW
 * payment against the same bill, never a resurrected row.
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatusType, readonly PaymentStatusType[]> = {
  scheduled: ['initiated'],
  initiated: ['paid', 'failed'],
  paid: [],
  failed: [],
};

export const PaymentSchema = z.object({
  id: IdSchema,
  bill_id: IdSchema,
  method: PaymentMethodSchema,
  /** Pay-from account (bank rails). Null on the card rail. */
  account_id: IdSchema.nullable(),
  amount_cents: MoneyCentsSchema,
  scheduled_date: IsoDateSchema,
  /**
   * When the money lands, not when it leaves — the video derives it from the
   * payment date ("2 business days" for ACH, findings §6). Null until known.
   */
  arrival_date: IsoDateSchema.nullable(),
  /** Set when the payment was released as part of a bulk batch (§8). */
  batch_id: IdSchema.nullable(),
  status: PaymentStatusSchema,
  failure_reason: z.string().nullable(),
});
export type PaymentType = z.infer<typeof PaymentSchema>;

/** Input for scheduling a payment against an approved bill. */
export const PaymentCreateSchema = z.object({
  bill_id: IdSchema,
  method: PaymentMethodSchema,
  account_id: IdSchema.optional(),
  amount_cents: MoneyCentsSchema.positive(),
  scheduled_date: IsoDateSchema,
});
export type PaymentCreateType = z.infer<typeof PaymentCreateSchema>;

/**
 * Virtual cards — the Ramp-card rail (findings §6): paying by card mints a
 * SINGLE-USE virtual card for the bill's amount. Three delivery modes, per
 * the `[ New card ]` panel's option cards; the card LOCKS after its one
 * charge. The video's preview shows last4, amount and a memo the vendor sees.
 */
export const VirtualCardDeliverySchema = z.enum([
  'auto_pay', // "Pay automatically" — Ramp charges the card for you
  'send_to_vendor', // "Send card to vendor" — vendor charges it themselves
  'use_myself', // "Use card myself" — number revealed to the payer
]);
export type VirtualCardDeliveryType = z.infer<typeof VirtualCardDeliverySchema>;

export const VirtualCardStatusSchema = z.enum(['active', 'locked']);
export type VirtualCardStatusType = z.infer<typeof VirtualCardStatusSchema>;

export const VirtualCardSchema = z.object({
  id: IdSchema,
  bill_id: IdSchema,
  /** The card payment it settles, once one exists. */
  payment_id: IdSchema.nullable(),
  last4: z.string().length(4),
  amount_cents: MoneyCentsSchema,
  delivery: VirtualCardDeliverySchema,
  /** "Memo for vendor" — travels with the card (§6). */
  memo: z.string().nullable(),
  single_use: z.boolean(),
  status: VirtualCardStatusSchema,
});
export type VirtualCardType = z.infer<typeof VirtualCardSchema>;

/**
 * Bulk release (findings §8): the For-payment tab multi-selects bills, the
 * Review-payments modal groups them BY VENDOR ("0/3 bills • ACH • account"),
 * and one "Release payments" click flips the whole batch. Vendor grouping is
 * derived from the member payments — the batch itself is just the release
 * event.
 */
export const PaymentBatchStatusSchema = z.enum(['pending_release', 'released']);
export type PaymentBatchStatusType = z.infer<typeof PaymentBatchStatusSchema>;

export const PaymentBatchSchema = z.object({
  id: IdSchema,
  created_by: IdSchema,
  status: PaymentBatchStatusSchema,
  released_at: IsoDateTimeSchema.nullable(),
});
export type PaymentBatchType = z.infer<typeof PaymentBatchSchema>;
