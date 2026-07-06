import type { BillTabType } from '@ramps/schemas/bill-tabs';
import { listBillTabs } from '@ramps/sdk/bill-tabs';
import { createServerSupabase } from '@ramps/sdk/server';
import { cache } from 'react';

/**
 * The Bill Pay tab catalog, request-deduped — the "server store" for the tabs.
 *
 * The SDK facade (`listBillTabs`) is framework-free by contract: a plain async
 * function, no React (see the SDK's AGENTS.md). Request-scoped dedup is the web
 * app's job, so we wrap it here in React `cache()`. Every caller inside one
 * request — the page's status filter and the tab bar's badges — shares a single
 * DB read of the `bill_tabs` lookup instead of hitting it twice.
 *
 * This is the server equivalent of a client store (`useSyncExternalStore`):
 * one source of truth, memoized for the lifetime of the request. When the
 * client-side custom-views feature lands, a `useBillCategories` store can read
 * the same validated rows.
 */
export const getBillTabs = cache(async (): Promise<BillTabType[]> => {
  const supabase = createServerSupabase();
  return listBillTabs(supabase);
});
