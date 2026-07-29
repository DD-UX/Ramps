'use client';

import { Kbd } from '@ramps/ui/Kbd';
import { Skeleton } from '@ramps/ui/Skeleton';
import { Spinner } from '@ramps/ui/Spinner';
import { useDelayedFlag } from '@ramps/ui/useDelayedFlag';
import Link, { useLinkStatus } from 'next/link';
import { useEffect } from 'react';

import { isTypingOrDialog } from '@/features/common/hooks/useUpDownNavigation';

import { useBillRail } from '../context/BillRail.context';
import type { ChevronState } from '../helpers/chevron.helpers';

/**
 * BillDetailsChevrons — the category steppers in a slim row under the rail's
 * "← Bill Pay" band: hop to the nearest NON-EMPTY neighbor category on the
 * chevron whitelist, landing on its first bill in rail order. All the
 * skip-empty / clamp / whitelist semantics live in `chevron.helpers`; the
 * provider resolves them against the warmed lists — this component only
 * renders the two {@link ChevronState}s.
 *
 * The steppers are the rail footer's Prev/Next pattern verbatim — a text
 * label with the `Kbd` hint baked in — except the label is the POST-SKIP
 * landing category's NAME (`← Drafts` … `For payment →`): the skip is
 * invisible in an arrow, so the name is where "next stop: For payment" gets
 * said, inline instead of a hover tooltip. The hint sits on the OUTER edge,
 * pointing the way the hop goes.
 *
 * The arrow KEYS are bound document-wide — ← / → for the horizontal walk
 * exactly as ↑ / ↓ walk the vertical list. A keypress commits the same way
 * `useUpDownNavigation` does: it CLICKS the stepper's own real anchor, so the
 * framework soft-navigates and the unsaved-changes guard's capture listener
 * gets its veto — keyboard and mouse are one code path. The shared
 * `isTypingOrDialog` gate keeps ←/→ away from fields (they own their caret)
 * and open dialogs.
 *
 * Each stepper is TRI-STATE, the same discipline as the rail footer:
 * - unsettled → a skeleton bar. A candidate list is still warming, so "there
 *   is nothing that way" is not yet knowable — disabled is a verdict, loading
 *   must not pass one.
 * - target → a real `<Link>` to the landing BILL (never a router.push — the
 *   guard's click capture is the whole point), `prefetch` forced on like the
 *   side nav's links.
 * - settled null → the muted clamp: every candidate that way is empty, and
 *   since the ring WRAPS that means every other category is — an empty app,
 *   not an end of the line. There is no landing name to say, so the Kbd
 *   keycap stays — same shape as the live stepper's hint — but FADED (the
 *   system's disabled dim): the key still reads as "this key exists", the
 *   fade says it does nothing here.
 *
 * A click also calls `flipCategory(target)` — the optimistic half of the hop:
 * the rail flips to the target category NOW (warm list or honest skeletons)
 * instead of freezing on the old one. React's onClick only fires when the
 * guard lets the click through (mouse or synthetic alike), so a vetoed press
 * flips nothing.
 *
 * The pending swap is the side nav's pattern: `useLinkStatus` from inside the
 * Link, `useDelayedFlag`-gated so the common warm hop never blinks a spinner;
 * when a commit genuinely stalls, the spinner takes the Kbd chip's place
 * (same slot, no reflow).
 */
export function BillDetailsChevrons() {
  const { chevronPrev, chevronNext } = useBillRail();

  // ←/→, document-wide, mirroring useUpDownNavigation's ↑/↓ binding — but
  // committing IMMEDIATELY (no debounced skim: the ring is a handful of stops
  // and each press re-derives the next hop from the already-flipped
  // category, so holding the key just walks the circle).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (isTypingOrDialog(event.target)) return;
      const anchor = document.querySelector<HTMLAnchorElement>(
        `a[data-chevron="${event.key === 'ArrowLeft' ? 'prev' : 'next'}"]`,
      );
      if (!anchor) return; // clamped or still loading — the key has no hop
      event.preventDefault();
      anchor.click();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    // The footer's row layout: one stepper at each end, px matching its band.
    <div
      className="px-rui-4 flex shrink-0 items-center justify-between"
      aria-label="Category navigation"
    >
      <Chevron state={chevronPrev} direction="Previous" hint="←" anchor="prev" />
      <Chevron state={chevronNext} direction="Next" hint="→" anchor="next" />
    </div>
  );
}

function Chevron({
  state,
  direction,
  hint,
  anchor,
}: {
  state: ChevronState;
  direction: 'Previous' | 'Next';
  hint: string;
  anchor: 'prev' | 'next';
}) {
  const { flipCategory } = useBillRail();

  // Still resolving — a candidate category's list hasn't landed. A bar the
  // rough size of a hint + name pair, so settling barely moves the band.
  if (!state.settled) {
    return <Skeleton className="h-3.5 w-20" />;
  }

  const { target } = state;
  if (!target) {
    // The clamp: a real verdict — nothing non-empty that way. No landing
    // name to show, so the same Kbd keycap the live stepper wears — just
    // FADED (the system's opacity-60 disabled dim) — marks the dead end:
    // one shape for the key in both states, opacity alone saying "inert".
    return (
      <Kbd aria-disabled="true" aria-label={`${direction} category`} className="opacity-60">
        {hint}
      </Kbd>
    );
  }

  // The Kbd hint rides the OUTER edge — ← before the name, the name before →
  // — so the pair reads as "that way lies Drafts".
  return (
    <Link
      href={`/bills/${target.billId}`}
      prefetch
      data-chevron={anchor}
      aria-label={`${direction} category: ${target.tab.name}`}
      // The optimistic flip — only reachable on a guard-approved click,
      // whether from the mouse or the ←/→ binding's synthetic click.
      onClick={() => flipCategory(target)}
      // group-hover scopes the underline to the NAME: an underline on the
      // anchor itself paints straight through the Kbd chip's box.
      className="gap-rui-2 text-ink group text-sm flex items-center"
    >
      {anchor === 'prev' && <ChevronHint hint={hint} />}
      <span className="group-hover:underline">{target.tab.name}</span>
      {anchor === 'next' && <ChevronHint hint={hint} />}
    </Link>
  );
}

/**
 * The stepper's Kbd chip with the delayed pending swap. Lives INSIDE the Link
 * because `useLinkStatus` reads the enclosing `<Link>`'s pending state; the
 * spinner takes the chip's slot so a stall never shifts the band.
 */
function ChevronHint({ hint }: { hint: string }) {
  const { pending } = useLinkStatus();
  const visible = useDelayedFlag(pending);
  if (visible) {
    return <Spinner size="sm" label="Loading bill" />;
  }
  return <Kbd>{hint}</Kbd>;
}
