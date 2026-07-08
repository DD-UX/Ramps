'use client';

import type { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';

import { SWR_GLOBAL_CONFIG } from '../constants/swr.constants';

/**
 * The app-wide SWR boundary — a thin `'use client'` shell so the root layout
 * (a Server Component) can still install the shared {@link SWR_GLOBAL_CONFIG}
 * for every client cache below it. One place owns the policy
 * (dedupe / keepPreviousData / revalidation), so individual `useSWR` calls stay
 * config-free.
 *
 * It intentionally does NOT seed data here: the global config is route-agnostic,
 * while first-paint seeds are per-route. A page that server-fetches a catalog
 * wraps its own subtree in a scoped `<SWRConfig value={{ fallback }}>` (SWR
 * merges the nested config over this one), so the seed lives next to the read
 * that produced it — see the bill-detail route seeding `USERS_SWR_KEY`.
 */
export function SwrProvider({ children }: PropsWithChildren) {
  return <SWRConfig value={SWR_GLOBAL_CONFIG}>{children}</SWRConfig>;
}
