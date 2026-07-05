import { z } from 'zod';

import { PaymentMethodSchema } from './payments.js';
import { IdSchema } from './primitives.js';

/**
 * Vendors are first-class (ANALYSIS §1 insight 3): the vendor record owns
 * payment details, default accounting coding, and a vendor OWNER (the person
 * responsible). Bills route based on vendor config.
 */

export const VendorStatusSchema = z.enum(['active', 'inactive']);
export type VendorStatusType = z.infer<typeof VendorStatusSchema>;

/** Payment details on file — shape depends on the rail, all simulated. */
export const VendorBankDetailsSchema = z.object({
  account_holder: z.string().min(1),
  bank_name: z.string().min(1),
  routing_number: z.string().min(1),
  /** Stored masked in the demo (`•••• 4821`) — never a real account number. */
  account_number_masked: z.string().min(1),
});
export type VendorBankDetailsType = z.infer<typeof VendorBankDetailsSchema>;

/**
 * The vendor's remembered line coding — what "Save as default coding for
 * <vendor>" writes (product-overview findings §5). Applied to new bills as
 * `coding_source: 'vendor_default'` so the UI can tell it apart from AI
 * autocoding ("Coded by Ramp") and manual picks.
 */
export const VendorDefaultCodingSchema = z.object({
  gl_account_id: IdSchema.nullable(),
  department_id: IdSchema.nullable(),
  class_id: IdSchema.nullable(),
  location_id: IdSchema.nullable(),
  custom_dimension_id: IdSchema.nullable(),
  billable: z.boolean(),
});
export type VendorDefaultCodingType = z.infer<typeof VendorDefaultCodingSchema>;

export const VendorSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  /** The human responsible for this vendor relationship. */
  owner_id: IdSchema,
  default_payment_method: PaymentMethodSchema.nullable(),
  /** Default coding applied when a bill lands for this vendor (§5). */
  default_coding: VendorDefaultCodingSchema.nullable(),
  bank_details: VendorBankDetailsSchema.nullable(),
  status: VendorStatusSchema,
});
export type VendorType = z.infer<typeof VendorSchema>;

/** Input for creating/editing a vendor (id is the DB's job). */
export const VendorCreateSchema = VendorSchema.omit({ id: true, status: true }).extend({
  status: VendorStatusSchema.default('active'),
});
export type VendorCreateType = z.infer<typeof VendorCreateSchema>;
