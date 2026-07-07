import {
  VendorListItemSchema,
  type VendorListItemType,
  type VendorReviewStateType,
  type VendorStatusType,
} from '@ramps/schemas/vendors';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk vendors facade — the API→DB contract for the Vendors table.
 *
 * The sibling of `bills.ts`, re-grained for vendors: it turns the `vendors`
 * table (plus the joined owner label and each vendor's rolled-up bill spend)
 * into validated `VendorListItemType` rows. It owns the query and the
 * snake_case boundary; callers get parsed models back, never raw PostgREST
 * JSON. `VendorListItemSchema.parse` is the single source of truth — no second
 * hand-mapped interface to drift from it.
 */

/**
 * The PostgREST select. Two embeds hang off the vendor row:
 *  - `owner:users(name)` — the joined owner label via the single
 *    `vendors_owner_id_fkey` FK (no disambiguation needed — vendors have
 *    exactly one edge to `users`, unlike bills' two flag edges).
 *  - `bills(amount_cents)` — the reverse of `bills.vendor_id`; every bill for
 *    this vendor, amount only. There is no spend column on `vendors`, so the
 *    365-day-style "total spend" is derived by summing these at read time.
 */
const VENDOR_LIST_SELECT = `
  id, name, owner_id, category, review_state,
  default_payment_method, default_coding, bank_details, status,
  owner:users ( name ),
  bills ( amount_cents )
` as const;

/** The row shape PostgREST returns for {@link VENDOR_LIST_SELECT}. */
interface VendorListRow {
  id: string;
  name: string;
  owner_id: string;
  category: string | null;
  review_state: string | null;
  default_payment_method: string | null;
  default_coding: unknown;
  bank_details: unknown;
  status: string;
  /** Embedded owner — a single object or null (an FK-to-one embed). */
  owner: { name: string } | null;
  /** Embedded bills — the reverse many side; summed into total_spend_cents. */
  bills: { amount_cents: number }[] | null;
}

export interface ListVendorsOptions {
  /**
   * Restrict to a set of workflow buckets — the active tab's review-state
   * group. The tabs (Needs review / Renewals / Duplicates / Switch cards) each
   * map to one {@link VendorReviewStateType}; the Overview tab passes an empty
   * group (no filter). Mirrors `listBills`'s tab-group filter so the two lists
   * share one shape. The non-Overview tabs are functional but currently return
   * no rows, since no seeded vendor sits in a workflow bucket.
   */
  reviewStates?: readonly VendorReviewStateType[];
  /**
   * Restrict to a set of vendor states — the toolbar's "Vendor status" filter
   * chip. Empty or omitted means no status filter. Kept distinct from the tab
   * filter above so a status chip can compose with any tab.
   */
  statuses?: readonly VendorStatusType[];
  /**
   * Free-text match for the toolbar's search field. Case-insensitive substring
   * across the vendor's name (`name ILIKE %q%`). Trimmed empty / omitted means
   * no text filter.
   */
  search?: VendorListItemType['name'] | null;
}

/**
 * Escape a raw search term for a PostgREST `ilike` filter. Commas and
 * parentheses are PostgREST filter delimiters, so we strip them rather than let
 * a stray `)` 400 the query — same defence as the bills facade.
 */
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[(),]/g, ' ').trim();
}

/**
 * List vendors, name-ordered, optionally filtered to the active tab's
 * review-state group (and/or a status chip). Returns validated models —
 * including the derived `total_spend_cents` — plus the total count for the tab.
 */
export async function listVendors(
  supabase: ServerSupabase,
  options: ListVendorsOptions = {},
): Promise<{ vendors: VendorListItemType[]; total: number }> {
  let query = supabase
    .from('vendors')
    .select(VENDOR_LIST_SELECT, { count: 'exact' })
    .order('name', { ascending: true });

  // A tab's review-state group → `review_state IN (…)`. Empty = Overview = no
  // filter. The non-Overview tabs will match no rows until data lands there.
  if (options.reviewStates && options.reviewStates.length > 0) {
    query = query.in('review_state', options.reviewStates as VendorReviewStateType[]);
  }

  // The toolbar status chip → `status IN (…)`. Composes with the tab filter.
  if (options.statuses && options.statuses.length > 0) {
    query = query.in('status', options.statuses as VendorStatusType[]);
  }

  // Toolbar free-text → `name ILIKE %term%`. Sanitized (a blank term after
  // stripping `(),` is a no-op, so an all-punctuation search doesn't collapse
  // to "match all").
  const term = options.search ? sanitizeSearchTerm(options.search) : '';
  if (term) {
    query = query.ilike('name', `%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw toSdkError(error);

  const rows = (data ?? []) as unknown as VendorListRow[];
  // Flatten the embedded owner to `owner_name`, sum the embedded bills into
  // `total_spend_cents`, then parse. The schema is the boundary guard — a shape
  // the DB shouldn't produce fails loudly here.
  const vendors = rows.map((row) => {
    const { owner, bills, ...vendor } = row;
    const total_spend_cents = (bills ?? []).reduce((sum, bill) => sum + bill.amount_cents, 0);
    return VendorListItemSchema.parse({
      ...vendor,
      owner_name: owner?.name ?? null,
      total_spend_cents,
    });
  });

  return { vendors, total: count ?? vendors.length };
}
