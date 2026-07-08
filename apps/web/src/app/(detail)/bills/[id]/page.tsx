import { notFound } from 'next/navigation';
import { SWRConfig } from 'swr';

import { BillDetailsContent } from '@/features/bill-details/components/BillDetailsContent';
import {
  getBillDetail,
  getBillRefs,
  getUsers,
} from '@/features/bill-details/data/bill-detail.data';
import { publicDocumentUrl } from '@/features/bill-details/helpers/document-url.helpers';
import { USERS_SWR_KEY } from '@/features/common/constants/swr.constants';

/**
 * /bills/[id] — the bill detail / draft-review screen.
 *
 * A Server Component that does all the data work and hands validated models to
 * the client shell: `getBillDetail` reads the bill (already `.parse()`d against
 * `BillDetailSchema`, with vendor/entity names and the approval chain embedded)
 * and `getBillRefs` reads the dropdown catalogs — both request-deduped via React
 * `cache()`, fetched together since neither depends on the other. An unknown id
 * yields `notFound()`. The invoice PDF's public URL is resolved here (the
 * storage base is a server-only secret) and passed down so the viewer stays a
 * dumb client leaf.
 *
 * The approver directory is server-fetched here too, but instead of being
 * drilled it seeds the SWR cache: `<SWRConfig fallback>` pre-fills
 * {@link USERS_SWR_KEY} so `useApproverCandidateUsers()` in the approvals picker
 * paints instantly from the seed, then freshens it with one silent background
 * revalidation (`revalidateIfStale: true`) — while still owning its own read.
 */
export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [bill, refs, users] = await Promise.all([getBillDetail(id), getBillRefs(), getUsers()]);
  if (!bill) notFound();

  const documentUrl = publicDocumentUrl(bill.document_url);

  return (
    <SWRConfig value={{ fallback: { [USERS_SWR_KEY]: users } }}>
      <BillDetailsContent bill={bill} refs={refs} documentUrl={documentUrl} />
    </SWRConfig>
  );
}
