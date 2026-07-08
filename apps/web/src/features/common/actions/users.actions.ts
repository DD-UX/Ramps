'use server';

import type { UserType } from '@ramps/schemas/users';
import { createServerSupabase } from '@ramps/sdk/server';
import { listUsers } from '@ramps/sdk/users';

/**
 * fetchUsers — the people directory as a **Server Action**, so the client can
 * refresh the approver catalog by calling a function instead of hitting a
 * bespoke endpoint. The body runs on the server: it opens the server-only
 * Supabase client and reuses the same {@link listUsers} SDK facade the page's
 * server loader uses, returning the already-`.parse()`d {@link UserType}s.
 *
 * This is the SWR fetcher behind {@link useUsers} — SWR dedupes and caches the
 * result across every records' user dropdown (one read for the whole app,
 * revalidated in the background). Keeping the read a Server Action honours the
 * repo's "no client-side Supabase, ever" rule: the DB client and its secret
 * never leave the server; the browser only ever sees the validated list.
 *
 * The catalog is directory-wide (not scoped to one bill), so it takes no args
 * and every caller shares the one cache key.
 */
export async function fetchUsers(): Promise<UserType[]> {
  const supabase = createServerSupabase();
  return listUsers(supabase);
}
