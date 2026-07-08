import { BillMutationResponseSchema } from '@ramps/schemas/bills';
import { createDemoBill } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

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
