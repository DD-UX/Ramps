import { notFound } from 'next/navigation';
import { SWRConfig } from 'swr';

import { BillDetailsContent } from '@/features/bill-details/components/BillDetailsContent';
import { BillDetailsRail } from '@/features/bill-details/components/BillDetailsRail';
import {
  getBillDetail,
  getBillRefs,
  getRailBills,
  getUsers,
} from '@/features/bill-details/data/bill-detail.data';
import { publicDocumentUrl } from '@/features/bill-details/helpers/document-url.helpers';
import { railStatusesFor } from '@/features/bill-details/helpers/rail.helpers';
import { getBillTabs } from '@/features/bills/data/bill-tabs.data';
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
 * The screen is a two-column grid (frame 1): the LEFT RAIL — side-menu width,
 * "← Bill Pay" and every bill in this bill's status category, the open one
 * highlighted — beside the editing surface. The rail's category is the first
 * Bill Pay tab whose status group contains this bill (`railStatusesFor`), and
 * its bills are fetched here (`getRailBills`) — it depends on the bill's
 * status, so it waits for the first batch. Rail navigation is plain links:
 * server-side, one fresh render per bill.
 *
 * The approver directory is server-fetched here too, but instead of being
 * drilled it seeds the SWR cache: `<SWRConfig fallback>` pre-fills
 * {@link USERS_SWR_KEY} so `useApproverCandidateUsers()` in the approvals picker
 * paints instantly from the seed, then freshens it with one silent background
 * revalidation (`revalidateIfStale: true`) — while still owning its own read.
 */
export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [bill, refs, users, tabs] = await Promise.all([
    getBillDetail(id),
    getBillRefs(),
    getUsers(),
    getBillTabs(),
  ]);
  if (!bill) notFound();

  const documentUrl = publicDocumentUrl(bill.document_url);
  const railStatuses = railStatusesFor(tabs, bill.status);
  const railBills = await getRailBills(railStatuses);

  return (
    <SWRConfig value={{ fallback: { [USERS_SWR_KEY]: users } }}>
      <div className="min-h-0 grid h-full flex-1 grid-cols-[16rem_minmax(0,1fr)]">
        <BillDetailsRail bills={railBills} statuses={railStatuses} activeId={bill.id} />
        <div className="min-h-0 min-w-0 flex flex-col">
          <BillDetailsContent bill={bill} refs={refs} documentUrl={documentUrl} />
        </div>
      </div>
    </SWRConfig>
  );
}
