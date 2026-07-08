'use client';

import type { UserType } from '@ramps/schemas/users';
import useSWR from 'swr';

import { fetchUsers } from '../actions/users.actions';
import { USERS_SWR_KEY } from '../constants/swr.constants';

export interface UseApproverCandidateUsersResult {
  /** The approver catalog. `[]` until the first read resolves (or, if seeded, the seed). */
  users: UserType[];
  /** True only while the very first read is in flight with nothing cached to show. */
  isLoading: boolean;
  /** Force a background revalidation (SWR `mutate` bound to the users key). */
  refresh: () => void;
}

/**
 * useApproverCandidateUsers — the client-side directory of people who can be
 * picked as approvers, cached and shared across every approver dropdown.
 *
 * Deliberately context-agnostic: it owns its own read off the shared
 * {@link USERS_SWR_KEY} and takes nothing from any provider, so any picker can
 * call it in isolation. All callers key off the one key, so a screen full of
 * pickers resolves to a single read (SWR dedupes) and one cached list. The
 * fetcher is the {@link fetchUsers} Server Action — the read runs on the server,
 * never client-side Supabase. Cache policy (dedupe window, `keepPreviousData`,
 * revalidation) comes from the app-wide `SWR_GLOBAL_CONFIG`, so this hook stays
 * config-free.
 *
 * When a route server-seeds the key via `fallbackData` (the bill-detail page
 * does), the first mount already has data and — with `revalidateIfStale: false`
 * — makes no network call; the list only refetches on reconnect or an explicit
 * `refresh()`.
 */
export function useApproverCandidateUsers(): UseApproverCandidateUsersResult {
  const { data, isLoading, mutate } = useSWR<UserType[]>(USERS_SWR_KEY, fetchUsers);

  return {
    users: data ?? [],
    isLoading: isLoading && data === undefined,
    refresh: () => {
      void mutate();
    },
  };
}
