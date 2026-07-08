'use client';

import { cn } from '@ramps/ui/cn';
import { Kbd } from '@ramps/ui/Kbd';
import Link from 'next/link';

import { useRailActive } from '../context/RailActive.context';

/**
 * The rail's Prev / Next footer (frame 1's bottom-left corner) — step to the
 * card above/below the active bill in the rail's visual order.
 *
 * The shortcuts are the ARROWS — ↑ for Prev, ↓ for Next — because the rail
 * reads top-to-bottom: the key's direction is the hop's direction. The arrow
 * KEYS are bound document-wide by {@link useUpDownNavigation} (via the
 * provider), not here: they move the optimistic pill one card instantly and
 * DEBOUNCE the actual route change — so tapping ↓↓↓ skims three cards and
 * commits ONE navigation once the keys settle. This footer only renders the
 * `↑`/`↓` HINTS and the clickable Prev/Next.
 *
 * The footer's own Prev/Next are real `<a href>` LINKS pointing at the ids the
 * context derives around the CURRENT pill — so mid-skim they track the pill,
 * not the page. Clicking one is a DIRECT hop (`setActiveId` cancels any queued
 * skim). An end of the list renders the label disabled (frame 1's muted
 * "Prev") instead of dropping it.
 */
export function BillDetailsRailNav() {
  const { prevId, nextId, setActiveId } = useRailActive();

  const step = (label: string, id: string | null, key: string) =>
    id ? (
      <Link
        href={`/bills/${id}`}
        // A direct footer click is its own navigation — point the pill and
        // drop any pending keyboard skim. A guard-vetoed click never reaches
        // here, so the pill stays put on a blocked hop.
        onClick={() => setActiveId(id)}
        className={cn('gap-rui-2 text-ink text-sm flex items-center', 'hover:underline')}
      >
        {label}
        <Kbd>{key}</Kbd>
      </Link>
    ) : (
      <span className="text-hushed text-sm" aria-disabled="true">
        {label}
      </span>
    );

  return (
    // h-14 matches the form footer's band across the border, one shared floor line.
    <div className="border-bone px-rui-4 h-14 flex shrink-0 items-center justify-between border-t">
      {step('Prev', prevId, '↑')}
      {step('Next', nextId, '↓')}
    </div>
  );
}
