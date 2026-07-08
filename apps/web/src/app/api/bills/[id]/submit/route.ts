import { BillMutationResponseSchema, BillSaveSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { BillNotEditableError, submitBill } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/bills/[id]/submit — CREATE BILL. A superset of the Save-draft PUT:
 * it saves the same edit form, THEN moves the bill `draft`/`missing_info` →
 * `awaiting_approval` so it enters the approval queue.
 *
 * The browser→API hop for the footer's "Create bill". Same id + body validation
 * as the save route; `submitBill` runs the persistence and the guarded
 * transition, raising {@link BillNotEditableError} (→ 409) if the bill's status
 * has already frozen it. Returns the re-read bill now in `awaiting_approval` so
 * the client can redirect into the "For approval" list confident of the move.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid bill id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BillSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid bill payload', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const supabase = createServerSupabase();

  try {
    const bill = await submitBill(supabase, id, parsed.data);
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
