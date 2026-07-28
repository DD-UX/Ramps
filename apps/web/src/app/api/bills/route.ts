import {
  BillListResponseSchema,
  BillMutationResponseSchema,
  BillStatusSchema,
  type BillStatusType,
} from '@ramps/schemas/bills';
import { createDemoBill, listBills } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizePageParam } from '@/features/bills/helpers/page-query.helpers';
import { normalizeSearchParam } from '@/features/common/helpers/search-query.helpers';

/**
 * The `?statuses=` query — a comma-separated status group (the rail's
 * category, a tab's roll-up). Parsed against the status enum so a bogus value
 * 400s instead of silently matching nothing. Absent/empty means "no filter"
 * (the Overview view), mirroring {@link listBills}'s own contract.
 */
const StatusesParamSchema = z.array(BillStatusSchema);

/**
 * The `?pageSize=` cap. The Bill Pay table asks for its `BILLS_PAGE_SIZE`
 * window; the cap just keeps a hand-crafted URL from turning the endpoint
 * into an unbounded dump with pagination semantics it didn't ask for.
 */
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/bills — LIST bills: a status group, optionally searched (`?q=`)
 * and windowed (`?page=` × `?pageSize=`).
 *
 * Two callers, one endpoint, distinguished by `?pageSize=`:
 *
 * - The detail screen's RAIL revalidates its per-category SWR entry here
 *   (focus / reconnect / mutation) with `?statuses=` alone — UNWINDOWED on
 *   purpose: a rail group is the WHOLE category, so pagination there would
 *   reintroduce the "silently incomplete list" problem the tri-state
 *   Prev/Next exists to avoid.
 * - The Bill Pay TABLE fetches its server-filtered, server-windowed pages by
 *   adding `?q=` / `?page=` / `?pageSize=` — the same query the RSC bootstrap
 *   runs, so a tab/search/page change revalidates to exactly what a full
 *   reload of that URL would render.
 *
 * Either way the SDK facade is the single query and the response is the same
 * validated envelope the server pages read ({@link BillListResponseSchema}) —
 * `total` is always the FULL filtered count, so the table's footer stays
 * honest about "of N" no matter the window. `?q=` and `?page=` are hardened
 * with the SAME normalizers the RSC applies to the page URL, so both
 * transports agree on what a blank search or a garbage page means.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = request.nextUrl.searchParams;
  const raw = query.get('statuses');
  const parts = raw ? raw.split(',').filter((part) => part.length > 0) : [];

  const parsed = StatusesParamSchema.safeParse(parts);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid statuses filter' }, { status: 400 });
  }
  const statuses: BillStatusType[] = parsed.data;

  const search = normalizeSearchParam(query.get('q') ?? undefined);
  const rawPageSize = Number(query.get('pageSize') ?? undefined);
  const pageSize =
    Number.isInteger(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, MAX_PAGE_SIZE) : null;

  const supabase = createServerSupabase();
  const { bills, total } = await listBills(supabase, {
    ...(statuses.length > 0 ? { statuses } : {}),
    search,
    // No/garbage `?pageSize=` means the rail's unwindowed read — omit BOTH
    // windowing options so `listBills` returns every matching row.
    ...(pageSize ? { page: normalizePageParam(query.get('page') ?? undefined), pageSize } : {}),
  });
  return NextResponse.json(BillListResponseSchema.parse({ bills, total }));
}

/**
 * POST /api/bills — CREATE A BILL (demo generator).
 *
 * The browser→API hop for the Bill Pay header's "Create demo bill" button — the
 * always-available sibling of the empty-state "Create your first bill". It
 * takes no body: `createDemoBill` fabricates a brand-new, believable bill
 * server-side (a random `draft`/`missing_info`, a complete rendered invoice PDF,
 * and — randomly — a PO number or not) so a tester can spin up another bill to
 * play with without any data entry. Returns the re-read bill (validated against
 * {@link BillMutationResponseSchema}) so the client can route straight into it.
 */
export async function POST(): Promise<NextResponse> {
  const supabase = createServerSupabase();
  const bill = await createDemoBill(supabase);
  return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
}
