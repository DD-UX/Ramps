import {
  VendorListItemSchema,
  type VendorListItemType,
  type VendorStatusType,
} from '@ramps/schemas/vendors';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk vendors facade — the API→DB contract for the Vendors table.
 *
 * The sibling of `bills.ts`, re-grained for vendors: it turns the `vendors`
 * table (plus the joined owner label) into validated `VendorListItemType` rows.
 * It owns the query and the snake_case boundary; callers get parsed models
 * back, never raw PostgREST JSON. `VendorListItemSchema.parse` is the single
 * source of truth — no second hand-mapped interface to drift from it.
 */

/**
 * The PostgREST select. `owner:users(name)` embeds the joined owner as a nested
 * object via the single `vendors_owner_id_fkey` FK (no disambiguation needed —
 * vendors have exactly one edge to `users`, unlike bills' two flag edges).
 */
const VENDOR_LIST_SELECT = `
  id, name, owner_id, default_payment_method, default_coding, bank_details, status,
  owner:users ( name )
` as const;

/** The row shape PostgREST returns for {@link VENDOR_LIST_SELECT}. */
interface VendorListRow {
  id: string;
  name: string;
  owner_id: string;
  default_payment_method: string | null;
  default_coding: unknown;
  bank_details: unknown;
  status: string;
  /** Embedded owner — a single object or null (an FK-to-one embed). */
  owner: { name: string } | null;
}

export interface ListVendorsOptions {
  /**
   * Restrict to a set of vendor states — the active tab's status group. Empty
   * or omitted means the unfiltered "All" view. Mirrors `listBills`'s tab-group
   * filter so the two lists share one shape.
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
 * List vendors, name-ordered, optionally filtered to the active tab's status
 * group. Returns validated models + the total count for the tab.
 */
export async function listVendors(
  supabase: ServerSupabase,
  options: ListVendorsOptions = {},
): Promise<{ vendors: VendorListItemType[]; total: number }> {
  let query = supabase
    .from('vendors')
    .select(VENDOR_LIST_SELECT, { count: 'exact' })
    .order('name', { ascending: true });

  // A tab's status group → `status IN (…)`. Empty group = All = no filter.
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
  // Flatten the embedded owner to `owner_name`, then parse. The schema is the
  // boundary guard — a shape the DB shouldn't produce fails loudly here.
  const vendors = rows.map((row) => {
    const { owner, ...vendor } = row;
    return VendorListItemSchema.parse({
      ...vendor,
      owner_name: owner?.name ?? null,
    });
  });

  return { vendors, total: count ?? vendors.length };
}

/**
 * Count vendors per state — the numbers behind the tab badges. One cheap
 * `status`-only select grouped in memory; the tab bar needs both counts
 * regardless of which tab is active, so this runs once alongside
 * {@link listVendors}. Keys are {@link VendorStatusType}; a state with no
 * vendors is simply absent (the caller treats missing as 0).
 */
export async function countVendorsByStatus(
  supabase: ServerSupabase,
): Promise<Partial<Record<VendorStatusType, number>>> {
  const { data, error } = await supabase.from('vendors').select('status');
  if (error) throw toSdkError(error);

  const rows = (data ?? []) as unknown as { status: VendorStatusType }[];
  return rows.reduce<Partial<Record<VendorStatusType, number>>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}
