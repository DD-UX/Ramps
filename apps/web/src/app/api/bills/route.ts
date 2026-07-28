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

/**
 * The `?statuses=` query — a comma-separated status group (the rail's
 * category, a tab's roll-up). Parsed against the status enum so a bogus value
 * 400s instead of silently matching nothing. Absent/empty means "no filter"
 * (the Overview view), mirroring {@link listBills}'s own contract.
 */
const StatusesParamSchema = z.array(BillStatusSchema);

/**
 * GET /api/bills — LIST bills, optionally filtered to a status group.
 *
 * The browser→API read behind the client-side rail cache: the detail screen's
 * rail keys an SWR entry per status group and revalidates it here (focus /
 * reconnect / mutation), instead of re-downloading the list through an RSC
 * render on every bill → bill hop. Returns the same validated envelope the
 * server pages read ({@link BillListResponseSchema}) — the SDK facade is the
 * single query; only the transport differs. Unwindowed on purpose: a rail
 * group is the WHOLE category, so pagination here would reintroduce the
 * "silently incomplete list" problem the tri-state Prev/Next exists to avoid.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const raw = request.nextUrl.searchParams.get('statuses');
  const parts = raw ? raw.split(',').filter((part) => part.length > 0) : [];

  const parsed = StatusesParamSchema.safeParse(parts);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid statuses filter' }, { status: 400 });
  }
  const statuses: BillStatusType[] = parsed.data;

  const supabase = createServerSupabase();
  const { bills, total } = await listBills(supabase, statuses.length > 0 ? { statuses } : {});
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
