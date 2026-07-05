'use client';

import { Button } from '@ramps/ui/Button';
import { ArrowRight, ReceiptText } from '@ramps/ui/icons';
import { useRouter } from 'next/navigation';

/**
 * BillPayJokePageContent — the centered placeholder shown on every route EXCEPT /bills.
 *
 * A full-height centered stack with a large icon, heading "Are you looking for Bill Pay?",
 * sub-heading "Sure you are 😉", and a button navigating to /bills.
 */
export function BillPayJokePageContent() {
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-rui-4 text-center">
        {/* Big icon — the kit's bills glyph, sized once here */}
        <ReceiptText width={64} height={64} strokeWidth={1.5} className="text-hushed" aria-hidden />

        {/* Heading */}
        <h1 className="font-heading text-2xl text-ink">
          Are you looking for Bill Pay?
        </h1>

        {/* Sub-heading with emoji */}
        <p className="font-body text-hushed">Sure you are 😉</p>

        {/* Button navigating to /bills */}
        <Button
          variant="primary"
          onClick={() => router.push('/bills')}
          trailingIcon={<ArrowRight width={16} />}
        >
          Go to Bill Pay
        </Button>
      </div>
    </div>
  );
}
