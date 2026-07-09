import type { Metadata } from 'next';

import { CommonBillPayJokePageContent } from '@/features/common/components/CommonBillPayJokePageContent';

// The tab title mirrors the SideMenu label for this route ("Manage spend").
export const metadata: Metadata = {
  title: 'Manage spend — Ramps',
};

// Manage spend is a nav destination but not the focus of this build — like every
// route except /bills, it lands on the "are you looking for Bill Pay?" joke so
// the sidebar never dead-ends on a 404.
export default function ManageSpendPage() {
  return <CommonBillPayJokePageContent />;
}
