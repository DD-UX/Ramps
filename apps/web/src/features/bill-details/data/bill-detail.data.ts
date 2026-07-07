import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillDetailType } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import type { UserType } from '@ramps/schemas/users';
import { listBillRefs } from '@ramps/sdk/bill-refs';
import { getBill } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { listUsers } from '@ramps/sdk/users';
import { cache } from 'react';

/**
 * The server "store" for one bill's edit screen, request-deduped.
 *
 * The SDK facades (`getBill`, `listBillRefs`) are framework-free by contract —
 * plain async functions that `.parse()` at the DB boundary. Request-scoped
 * dedup is the web app's job, so both are wrapped in React `cache()`: the page
 * loader and `generateMetadata` can each ask for the same bill and share one
 * read.
 *
 * `getBillDetail` returns `null` for a missing/unknown id so the route can
 * `notFound()`; the ref catalogs are shared across every bill, so they get
 * their own cache key.
 *
 * A malformed id (anything that isn't a UUID) can't match a row, so we short-
 * circuit to `null` before touching Postgres — otherwise the DB rejects it with
 * `22P02 invalid input syntax for type uuid` and the route 500s instead of 404s.
 */
export const getBillDetail = cache(async (billId: string): Promise<BillDetailType | null> => {
  if (!IdSchema.safeParse(billId).success) return null;

  const supabase = createServerSupabase();
  return getBill(supabase, billId);
});

/** Dropdown catalogs (vendors, GL accounts, …) — one read per request. */
export const getBillRefs = cache(async (): Promise<BillDetailRefsType> => {
  const supabase = createServerSupabase();
  return listBillRefs(supabase);
});

/**
 * The people directory — the approver catalog behind the ApprovalsWorkflow's
 * "by role" groups and "specific user" picker. Shared across every bill, so it
 * gets its own request-deduped cache key like the ref catalogs.
 */
export const getUsers = cache(async (): Promise<UserType[]> => {
  const supabase = createServerSupabase();
  return listUsers(supabase);
});
