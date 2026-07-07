import { z } from 'zod';

import {
  ClassSchema,
  DepartmentSchema,
  GlAccountSchema,
  LocationSchema,
  TaxCodeSchema,
} from './dimensions.js';
import { EntitySchema } from './bills.js';
import { PaymentAccountSchema } from './payments.js';
import { VendorSchema } from './vendors.js';

/**
 * Reference catalogs for the bill DETAIL form (`/bills/[id]`) — the option
 * lists behind every picker on the page: the vendor match dropdown, the
 * "Create bill under" entity select, the line-item coding grid's Accounting
 * dropdowns (GL account / department / class / location / tax code), and the
 * payment section's "Pay from account".
 *
 * These are just the existing reference schemas gathered into one envelope so
 * the page loads its whole option universe in a single validated read. The
 * schema is the boundary guard — the SDK `.parse()`s the joined catalogs here,
 * so a section component can trust `refs.gl_accounts` is well-formed without a
 * second round-trip.
 */
export const BillDetailRefsSchema = z.object({
  vendors: z.array(VendorSchema),
  entities: z.array(EntitySchema),
  gl_accounts: z.array(GlAccountSchema),
  departments: z.array(DepartmentSchema),
  classes: z.array(ClassSchema),
  locations: z.array(LocationSchema),
  tax_codes: z.array(TaxCodeSchema),
  payment_accounts: z.array(PaymentAccountSchema),
});
export type BillDetailRefsType = z.infer<typeof BillDetailRefsSchema>;
