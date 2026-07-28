import { BillDetailsScreen } from '@/features/bill-details/components/BillDetailsScreen';
import { getBillDetail } from '@/features/bill-details/data/bill-detail.data';
import { publicDocumentUrl } from '@/features/bill-details/helpers/document-url.helpers';

/**
 * /bills/[id] — the bill detail / draft-review screen's route.
 *
 * Deliberately THIN: the layout above owns the frame (rail + grid) and the
 * bill-independent catalogs; everything bill-SPECIFIC is client-rendered by
 * {@link BillDetailsScreen} off the SWR cache. This page's one job is the
 * STREAMED SEED — it STARTS `getBillDetail(id)` and hands the un-awaited
 * promise across the RSC boundary, so the shell reaches the client
 * immediately and the screen upgrades in place when the read settles
 * (`await` here would resurrect the blank-on-every-hop loading boundary this
 * design removed). The invoice PDF's public URL rides inside the same
 * promise, resolved server-side because the storage base is a server-only
 * secret.
 *
 * "No such bill" resolves to null INSIDE the promise (not a server
 * `notFound()` — the page never awaits, so it never knows); the client
 * screen throws `notFound()` when the null lands, same boundary either way.
 */
export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const seed = getBillDetail(id).then((bill) =>
    bill ? { bill, documentUrl: publicDocumentUrl(bill.document_url) } : null,
  );

  return <BillDetailsScreen id={id} seed={seed} />;
}
