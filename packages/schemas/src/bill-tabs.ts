import { z } from 'zod';

import { BillStatusSchema } from './bills.js';
import { IdSchema } from './primitives.js';

/**
 * Bill Pay tabs — the five product categories as DATA, not a hardcoded list.
 *
 * Ramp's IA groups the nine-state bill lifecycle into five buckets (Overview |
 * Drafts | For approval | For payment | History — see the product-overview
 * frames). This schema is the boundary guard for the `bill_tabs` lookup table
 * that owns that grouping, so the tabs — and, later, custom saved views — are a
 * data change, not a code change.
 *
 * Lookup convention (repo rule): every lookup/catalog table carries `id` +
 * `name` + `code`, then its own characteristics. Here `code` is the URL-safe
 * slug the app passes as `?tab=` (unique, readable, reseed-stable), `name` is
 * the label, and `statuses` is the group it rolls up — an empty array means
 * "unfiltered" (the Overview tab). `sort_order` is left-to-right position.
 *
 * `created_by` is the tab's owner, ahead of custom views: NULL = a system tab
 * (the five seeded categories no one owns), a user id = that user's custom tab.
 * That single nullable field is the whole system-vs-custom distinction; a later
 * delete can read it to gate "creator or admin only" (structure only for now).
 */
export const BillTabSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  /** The `?tab=` slug — unique, URL-safe, stable across reseeds. */
  code: z.string().min(1),
  /** The lifecycle states this tab rolls up. Empty = unfiltered (Overview). */
  statuses: z.array(BillStatusSchema),
  /** Left-to-right order in the tab bar. */
  sort_order: z.number().int().nonnegative(),
  /** Owner: NULL = system tab; a user id = that user's custom tab. */
  created_by: IdSchema.nullable(),
});
export type BillTabType = z.infer<typeof BillTabSchema>;
