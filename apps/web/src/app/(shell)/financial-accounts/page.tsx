import type { Metadata } from 'next';

import { CommonBillPayJokePageContent } from '@/features/common/components/CommonBillPayJokePageContent';

// The tab title mirrors the SideMenu label for this route ("Financial accounts").
export const metadata: Metadata = {
  title: 'Financial accounts — Ramps',
};

// Financial accounts is a nav destination but not the focus of this build — like
// every route except /bills, it lands on the "are you looking for Bill Pay?"
// joke so the sidebar never dead-ends on a 404.
export default function FinancialAccountsPage() {
  return <CommonBillPayJokePageContent />;
}
