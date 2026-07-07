import { notFound } from 'next/navigation';

import { BillDetailsContent } from '@/features/bill-details/components/BillDetailsContent';
import { getBillDetail, getBillRefs, getUsers } from '@/features/bill-details/data/bill-detail.data';
import { publicDocumentUrl } from '@/features/bill-details/helpers/document-url.helpers';

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
 */
export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [bill, refs, users] = await Promise.all([getBillDetail(id), getBillRefs(), getUsers()]);
  if (!bill) notFound();

  const documentUrl = publicDocumentUrl(bill.document_url);

  return <BillDetailsContent bill={bill} refs={refs} users={users} documentUrl={documentUrl} />;
}
