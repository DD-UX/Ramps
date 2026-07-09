import type { Metadata } from 'next';

import { CommonBillPayJokePageContent } from '@/features/common/components/CommonBillPayJokePageContent';

// The tab title mirrors the SideMenu label for this route ("Home").
export const metadata: Metadata = {
  title: 'Home — Ramps',
};

export default function HomePage() {
  return <CommonBillPayJokePageContent />;
}
