import { Button } from '@ramps/ui/Button';
import { EmptyState } from '@ramps/ui/EmptyState';
import { FileQuestion } from '@ramps/ui/icons';
import Link from 'next/link';

/**
 * The 404 for an unknown bill id — reached via `notFound()` in the route when
 * `getBillDetail` returns null. A centred EmptyState with a way back to Bill Pay.
 */
export default function BillNotFound() {
  return (
    <div className="bg-white p-rui-6 flex flex-1 items-center justify-center">
      <EmptyState
        icon={<FileQuestion size={28} />}
        title="Bill not found"
        description="This bill doesn't exist or may have been removed."
        action={
          <Link href="/bills">
            <Button variant="secondary">Back to Bill Pay</Button>
          </Link>
        }
      />
    </div>
  );
}
