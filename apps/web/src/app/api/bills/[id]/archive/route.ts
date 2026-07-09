import { BillMutationResponseSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { archiveBill, BillNotEditableError } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/bills/[id]/archive — ARCHIVE. Files a bill out of the working set
 * (→ `archived`). No body — it's a pure state advance behind the row/footer
 * overflow menu. `archiveBill` guards the move against the transition map,
 * raising {@link BillNotEditableError} (→ 409) for an already-archived bill.
 * Returns the re-read `archived` bill.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid bill id' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  try {
    const bill = await archiveBill(supabase, id);
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
