import { BillDetailResponseSchema, BillSaveSchema } from '@ramps/schemas/bills';
import { getBill, saveBill } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

import { publicDocumentUrl } from '@/features/bill-details/helpers/document-url.helpers';

import { requireBillId, requireBody, respondWithBillMutation } from './helpers/bill-route.helpers';

/**
 * GET /api/bills/[id] — READ one bill's full detail.
 *
 * The browser→API read behind the client-side detail cache. The RSC page seeds
 * the SWR entry by STREAMING the same read (it starts `getBillDetail` and
 * hands the promise across); this route is the revalidation path — a rail hop
 * confirming its seed, a mutation reconciling, a long-open screen freshening on
 * reconnect. Same envelope both ways ({@link BillDetailResponseSchema}): the
 * bill plus the invoice PDF's public URL, resolved HERE because the storage
 * base is a server-only secret. 404 mirrors the page's `notFound()`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  const supabase = createServerSupabase();
  const bill = await getBill(supabase, id);
  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  }

  return NextResponse.json(
    BillDetailResponseSchema.parse({ bill, documentUrl: publicDocumentUrl(bill.document_url) }),
  );
}

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
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  const { value: form, response: badBody } = await requireBody(
    request,
    BillSaveSchema,
    'bill payload',
  );
  if (badBody) return badBody;

  return respondWithBillMutation((supabase) => saveBill(supabase, id, form));
}
