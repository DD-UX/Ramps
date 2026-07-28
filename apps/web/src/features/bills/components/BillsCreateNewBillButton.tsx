'use client';

import { Button } from '@ramps/ui/Button';
import { Plus } from '@ramps/ui/icons';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { apiClient } from '@/features/common/helpers/api-client.helpers';
import { getCmdCharacter } from '@/features/common/helpers/platform.helpers';
import { useCommandPlusKey } from '@/features/common/hooks/useCommandPlusKey';
import { useIsApplePlatform } from '@/features/common/hooks/useIsApplePlatform';

/**
 * BillsCreateNewBillButton — the Bill Pay header's "Create demo bill" CTA.
 *
 * Mirrors the empty-state "Create your first bill" primary from the AP-agent
 * frame (lime `primary`, leading `+`, NO options caret) but lives permanently in
 * the header so a tester can mint yet another bill to play with at any time.
 *
 * Deliberately SELF-CONTAINED — no props, no prop-drilling. It owns the whole
 * interaction client-side: it holds its own loading state, calls the SDK's
 * `bills.createDemo()` (which fabricates a complete, believable bill server-
 * side — a random draft/missing_info, a rendered invoice PDF, and a PO number
 * or not), and on success routes straight into the new bill's detail page so
 * the tester lands on something to code. A double-click can't fire twice: the
 * button disables itself the moment it starts (the `loading` prop swaps the
 * leading icon for a spinner and sets `disabled`).
 *
 * ⌘/Ctrl+Enter is the keyboard spelling of the same click — `useCommandPlusKey`
 * owns the document listener, and the chord is advertised as trailing keycaps
 * via the Button's `keys` prop (exactly the snapshot-9 "Create bill ⌘↵"
 * treatment), with the modifier glyph resolved per-OS by `useIsApplePlatform` —
 * the same single platform read behind the top bar's ⌘K chip. The chord unbinds
 * while a create is in flight, mirroring the button's own disabled state.
 * (⌘/Ctrl+N was tried first but browsers reserve it for "new window" and never
 * deliver it to the page. ⌘Enter is safe here: the detail route's save/approve
 * binding lives on a different page, so the two never coexist.)
 */
export function BillsCreateNewBillButton() {
  const router = useRouter();
  const isApple = useIsApplePlatform();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { bill } = await apiClient.bills.createDemo();
      // Land the tester on the fresh bill; refresh so the list behind it also
      // reflects the new row when they navigate back.
      router.push(`/bills/${bill.id}`);
      router.refresh();
    } catch {
      setError('Could not create a bill. Please try again.');
      setLoading(false);
    }
    // On success we intentionally keep `loading` true through the navigation so
    // the button stays inert until the detail page takes over.
  }, [loading, router]);

  // The chord IS the click — same handler, same in-flight guard (the hook
  // additionally unbinds while loading, so a held-down repeat can't queue up).
  useCommandPlusKey(
    'Enter',
    (event) => {
      event.preventDefault();
      void onClick();
    },
    !loading,
  );

  return (
    <div className="gap-rui-1 flex flex-col items-end">
      <Button
        variant="primary"
        leadingIcon={<Plus size={16} />}
        loading={loading}
        onClick={onClick}
        keys={[getCmdCharacter(isApple), '↵']}
      >
        Create demo bill
      </Button>
      {error ? (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      ) : null}
    </div>
  );
}
