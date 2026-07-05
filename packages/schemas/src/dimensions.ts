import { z } from 'zod';

import { IdSchema } from './primitives.js';

/**
 * Accounting dimensions — the "Accounting X" dropdowns on a bill line
 * (ANALYSIS §4). These are the fields normally absorbed from the accounting
 * integration (QuickBooks/Sage/Xero); we seed them as local reference tables.
 *
 * `external_id` + `source` are the integration seam: nullable provenance that
 * says "this record came from provider N with native id X" — a future live
 * sync becomes a data problem, not a schema migration.
 */

/** Where a dimension record came from. `seed` = our local demo data. */
export const DimensionSourceSchema = z.enum([
  'quickbooks',
  'netsuite', // the product-overview video codes against NetSuite (findings §5)
  'sage',
  'xero',
  'seed',
]);
export type DimensionSourceType = z.infer<typeof DimensionSourceSchema>;

/** Shared shape of every dimension reference table. */
const dimensionBase = {
  id: IdSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  active: z.boolean(),
  external_id: z.string().nullable(),
  source: DimensionSourceSchema,
};

/** GL account — the "Accounting Category" a line codes to. */
export const GlAccountSchema = z.object({
  ...dimensionBase,
  /** Chart-of-accounts grouping shown as the dropdown's secondary line. */
  category: z.string().min(1),
  /** Account type (Expense / Asset / Liability…) — trailing meta in the UI. */
  type: z.string().min(1),
});
export type GlAccountType = z.infer<typeof GlAccountSchema>;

/** Accounting Department. */
export const DepartmentSchema = z.object(dimensionBase);
export type DepartmentType = z.infer<typeof DepartmentSchema>;

/** Accounting Class. */
export const ClassSchema = z.object(dimensionBase);
export type ClassType = z.infer<typeof ClassSchema>;

/** Accounting Location. */
export const LocationSchema = z.object(dimensionBase);
export type LocationType = z.infer<typeof LocationSchema>;

/**
 * Custom dimension — NetSuite-style custom segments (the "Custom" column in
 * the coding row, findings §5). `field` names the segment the value belongs
 * to (e.g. "Project"), so one table serves any number of segments.
 */
export const CustomDimensionSchema = z.object({
  ...dimensionBase,
  field: z.string().min(1),
});
export type CustomDimensionType = z.infer<typeof CustomDimensionSchema>;

/** Accounting Tax Code — rate in basis points (integer, never a float). */
export const TaxCodeSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  rate_bps: z.number().int().min(0),
  active: z.boolean(),
  external_id: z.string().nullable(),
  source: DimensionSourceSchema,
});
export type TaxCodeType = z.infer<typeof TaxCodeSchema>;
