import { CommonBillPayJokePageContent } from '@/features/common/components/CommonBillPayJokePageContent';

// My expenses is a nav destination but not the focus of this build — like every
// route except /bills, it lands on the "are you looking for Bill Pay?" joke so
// the sidebar never dead-ends on a 404.
export default function MyExpensesPage() {
  return <CommonBillPayJokePageContent />;
}
