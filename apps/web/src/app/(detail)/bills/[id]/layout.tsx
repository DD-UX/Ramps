import { IconButton } from '@ramps/ui/IconButton';
import { ArrowLeft } from '@ramps/ui/icons';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';

/**
 * The bill-detail entity layout — the bill-specific slice of the shared
 * `(detail)` frame. It adds the back bar that returns the reviewer to Bill Pay
 * (`/bills`), then renders the bill surface (`BillDetailsContent`) beneath it.
 * A sibling detail entity (say `vendors/[id]`) would provide its own layout with
 * its own back target, both nesting inside the common `(detail)` surface.
 */
export default function BillDetailLayout({ children }: PropsWithChildren) {
  return (
    <div className="grid h-full grid-rows-[52px_minmax(0,1fr)]">
      <div className="gap-rui-3 px-rui-6 pt-rui-2 border-bone flex items-center border-b">
        <Link href="/bills" aria-label="Back to Bill Pay">
          <IconButton
            label="Back to Bill Pay"
            variant="ghost"
            rounded
            icon={<ArrowLeft size={20} />}
          />
        </Link>
      </div>
      {children}
    </div>
  );
}
