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
 * - `revalidateIfStale: false` — if the cache already holds a value (e.g. the
 *   server-seeded `fallbackData`), don't auto-refire on mount; only fetch when
 *   there's nothing cached or an explicit `mutate`.
 * - `keepPreviousData: true` — on a key change / revalidation, keep serving the
 *   last data until the newer data lands. Optimistic: no flash to `undefined`,
 *   no rehydration flicker mid-swap.
 */
export const SWR_GLOBAL_CONFIG: SWRConfiguration = {
  dedupingInterval: 10 * 1000,
  revalidateOnReconnect: true,
  revalidateOnFocus: false,
  revalidateIfStale: false,
  keepPreviousData: true,
};

/**
 * The shared cache key for the people directory (the approver catalog). Every
 * `useUsers()` caller keys off this, so they all read one cached list and one
 * in-flight request — and the server can seed it by name via `fallbackData`.
 */
export const USERS_SWR_KEY = 'USERS_SWR_KEY';
