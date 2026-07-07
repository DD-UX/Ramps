import { BillDetailRefsSchema, type BillDetailRefsType } from '@ramps/schemas/bill-refs';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk bill-refs facade — the option universe for the `/bills/[id]` form.
 *
 * The detail page's pickers (vendor match, "Create bill under" entity, the
 * line-item coding dropdowns, "Pay from account") all read from reference
 * tables. Rather than one round-trip per dropdown, this facade loads the whole
 * catalog in parallel and `.parse()`s it against {@link BillDetailRefsSchema} —
 * one validated envelope the page hands to its sections.
 *
 * Framework-free by contract; the feature layer wraps it in React `cache()`.
 */
export async function listBillRefs(supabase: ServerSupabase): Promise<BillDetailRefsType> {
  const [
    vendors,
    entities,
    glAccounts,
    departments,
    classes,
    locations,
    taxCodes,
    paymentAccounts,
  ] = await Promise.all([
    supabase.from('vendors').select('*').order('name'),
    supabase.from('entities').select('id, name').order('name'),
    supabase.from('gl_accounts').select('*').eq('active', true).order('code'),
    supabase.from('departments').select('*').eq('active', true).order('name'),
    supabase.from('classes').select('*').eq('active', true).order('name'),
    supabase.from('locations').select('*').eq('active', true).order('name'),
    supabase.from('tax_codes').select('*').eq('active', true).order('name'),
    supabase.from('payment_accounts').select('*').order('name'),
  ]);

  // Surface the first failing read — any one broken catalog fails the page load
  // loudly rather than rendering a form with a silently-empty dropdown.
  const firstError =
    vendors.error ??
    entities.error ??
    glAccounts.error ??
    departments.error ??
    classes.error ??
    locations.error ??
    taxCodes.error ??
    paymentAccounts.error;
  if (firstError) throw toSdkError(firstError);

  return BillDetailRefsSchema.parse({
    vendors: vendors.data ?? [],
    entities: entities.data ?? [],
    gl_accounts: glAccounts.data ?? [],
    departments: departments.data ?? [],
    classes: classes.data ?? [],
    locations: locations.data ?? [],
    tax_codes: taxCodes.data ?? [],
    payment_accounts: paymentAccounts.data ?? [],
  });
}
