import type { SWRConfiguration } from 'swr';

/**
 * The one SWR policy shared by every client cache in the app, applied through
 * the root `<SWRConfig>`. Tuned for read-only reference catalogs that many
 * records reuse (the approver directory, and later vendors / GL accounts):
 *
 * - `dedupingInterval` — collapse duplicate reads of the same key within a
 *   short window, so a screen full of user dropdowns triggers ONE fetch.
 * - `revalidateOnReconnect` — the network coming back is a real "data may have
 *   changed" signal, so refresh then.
 * - `revalidateOnFocus: false` — tab focus is noise for slow-moving catalogs;
 *   don't refetch on every window focus.
 * - `revalidateIfStale: true` — stale-while-revalidate. A server-seeded key
 *   (`fallbackData`) paints instantly from the seed, then fires ONE background
 *   revalidation on mount to freshen it — the user sees the seed with no
 *   spinner, and the list silently catches up if the directory drifted. The
 *   trade against `false` (never re-fire while cached) is a bit of network for
 *   always-current reference data; `keepPreviousData` keeps the swap flicker-free.
 * - `keepPreviousData: true` — on a key change / revalidation, keep serving the
 *   last data until the newer data lands. Optimistic: no flash to `undefined`,
 *   no rehydration flicker mid-swap.
 */
export const SWR_GLOBAL_CONFIG: SWRConfiguration = {
  dedupingInterval: 10 * 1000,
  revalidateOnReconnect: true,
  revalidateOnFocus: false,
  revalidateIfStale: true,
  keepPreviousData: true,
};

/**
 * The shared cache key for the people directory (the approver catalog). Every
 * `useApproverCandidateUsers()` caller keys off this, so they all read one cached
 * list and one in-flight request — and the server can seed it via `fallbackData`.
 */
export const USERS_SWR_KEY = 'USERS_SWR_KEY';
