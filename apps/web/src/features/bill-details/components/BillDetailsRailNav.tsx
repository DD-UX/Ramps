'use client';

import { cn } from '@ramps/ui/cn';
import { Kbd } from '@ramps/ui/Kbd';
import { Skeleton } from '@ramps/ui/Skeleton';
import Link from 'next/link';

import { useBillRail } from '../context/BillRail.context';
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
 * skim). An end of the list renders the step disabled instead of dropping it:
 * the muted label (frame 1's "Prev") KEEPS its Kbd keycap, faded — the same
 * treatment as the chevrons' clamp, so a dead end never reshapes the row,
 * opacity alone says "inert".
 *
 * The footer is TRI-STATE: while the rail's `loading` (read straight off the
 * rail context, same flag the list body uses) neither neighbour is KNOWN,
 * which is not the same as absent — so the steps render skeleton bars, never
 * the muted end-of-list label. "Disabled" is a verdict ("you're at the
 * edge"); loading must not pass one.
 */
export function BillDetailsRailNav() {
  const { loading } = useBillRail();
  const { prevId, nextId, setActiveId } = useRailActive();

  const step = (label: string, id: string | null, key: string) =>
    loading ? (
      <Skeleton className="h-3.5 w-14" />
    ) : id ? (
      <Link
        href={`/bills/${id}`}
        // A direct footer click is its own navigation — point the pill and
        // drop any pending keyboard skim. A guard-vetoed click never reaches
        // here, so the pill stays put on a blocked hop.
        onClick={() => setActiveId(id)}
        // group-hover scopes the underline to the label — an underline on the
        // anchor itself paints straight through the Kbd chip's box.
        className={cn('gap-rui-2 text-ink text-sm group flex items-center')}
      >
        <span className="group-hover:underline">{label}</span>
        <Kbd>{key}</Kbd>
      </Link>
    ) : (
      // The edge verdict keeps the live step's SHAPE — hushed label AND the
      // Kbd keycap, dimmed (the system's opacity-60 disabled fade, same as
      // the chevrons' clamp): the key still exists, it just does nothing here.
      <span className="gap-rui-2 text-hushed text-sm flex items-center" aria-disabled="true">
        {label}
        <Kbd className="opacity-60">{key}</Kbd>
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
