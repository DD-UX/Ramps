import { BillMutationResponseSchema, BillSaveSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { BillNotEditableError, saveBill } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

/**
 * PUT /api/bills/[id] — SAVE DRAFT. Persist the whole edit form (header fields
 * + the line-items grid) for a pre-submit bill.
 *
 * The browser→API hop for the footer's "Save draft" and the guard's "Save
 * draft" exit. It validates the id and the body against the schema SSoT, then
 * delegates the header UPDATE + line-item replace-all to `saveBill`. The SDK
 * owns the editable-status guard (draft / missing_info only) and raises
 * {@link BillNotEditableError} on a frozen bill, which we surface as a 409 so a
 * stale client can't rewrite a submitted record. Returns the re-read bill so
 * the client resets its form to the server's own truth (fresh line ids).
 */
export async function PUT(
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
    const bill = await saveBill(supabase, id, parsed.data);
    // Re-validate the response shape at the boundary before it crosses the wire.
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
