'use client';

import { LayoutGroup } from 'motion/react';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';

import { useUpDownNavigation } from '@/features/common/hooks/useUpDownNavigation';

import { RAIL_NAV_DEBOUNCE_MS } from '../constants/rail-active.constants';
import { railAnchorId } from '../helpers/rail.helpers';

/**
 * The rail's OPTIMISTIC active record — which card carries the floating
 * limestone background right now — and the DEBOUNCED ↑/↓ skim that drives it.
 *
 * All the moving parts live in the pure {@link useUpDownNavigation} hook; this
 * provider only ADAPTS it to the rail:
 *  - it turns the rail's flat `orderedIds` into the hook's `{ id, href }` items
 *    (every rail hop is `/bills/:id`),
 *  - it seeds the hook with `initialActiveId` — the server truth for the page
 *    this render is showing — so a landed navigation re-syncs the pill, and
 *  - it hands the hook `resolveAnchor`: the rail already renders every card as
 *    a real `<Link>` (tagged `data-rail-anchor`), so the hook COMMITS a skim by
 *    clicking that card's own anchor. One click is the whole hop — a soft route
 *    change that ALSO passes the unsaved-changes guard's click capture — so
 *    there's no injected router, no hidden probe anchor here.
 *
 * WHY A PERSISTED PROVIDER. The provider instance lives in the (unkeyed,
 * state-preserved) rail, so the pill and any in-flight debounce survive a
 * `/bills/:id` → `/bills/:id` hop. The new page changes the `initialActiveId`
 * PROP (not a remount); the hook re-syncs its pointer from it, making a normal
 * hop a no-op and a same-index / back-forward hop land on the RIGHT card
 * rather than snapping to an end.
 */
interface RailActiveContextValue {
  /** The optimistically-active bill id (which card holds the pill). */
  activeId: string;
  /** Point the pill at `id` immediately — direct clicks; cancels any pending skim. */
  setActiveId: (id: string) => void;
  /** Move the pill one card (down `+1` / up `-1`) and (re)arm the debounced commit. */
  stepActive: (delta: 1 | -1) => void;
  /** Prev/Next ids around the CURRENT pill (optimistic), for the footer anchors. */
  prevId: string | null;
  /** @see prevId */
  nextId: string | null;
}

const RailActiveContext = createContext<RailActiveContextValue | null>(null);

export interface RailActiveProviderProps {
  /** The server-rendered truth: the id of the bill this page is showing. */
  initialActiveId: string;
  /** The rail's flat visual order — the list ↑/↓ and Prev/Next both walk. */
  orderedIds: readonly string[];
  children: ReactNode;
}

export function RailActiveProvider({
  initialActiveId,
  orderedIds,
  children,
}: RailActiveProviderProps) {
  // Every rail hop is `/bills/:id`; the hook owns the pointer and the debounce
  // and commits by clicking the row's real anchor — it just needs to find it.
  const items = useMemo(
    () => orderedIds.map((id) => ({ id, href: `/bills/${id}` })),
    [orderedIds],
  );

  // The hook clicks the card's own `<Link>` to commit — locate it by the
  // `data-rail-anchor` tag {@link BillDetailsRailItem} stamps on each card.
  const resolveAnchor = useCallback(
    (id: string) =>
      document.querySelector<HTMLAnchorElement>(`a[${railAnchorId(id)}]`),
    [],
  );

  const { activeId, prevId, nextId, stepActive, setActiveId } = useUpDownNavigation({
    items,
    activeId: initialActiveId,
    resolveAnchor,
    debounceMs: RAIL_NAV_DEBOUNCE_MS,
  });

  const value = useMemo(
    () => ({ activeId, setActiveId, stepActive, prevId, nextId }),
    [activeId, setActiveId, stepActive, prevId, nextId],
  );

  return (
    <RailActiveContext.Provider value={value}>
      <LayoutGroup>{children}</LayoutGroup>
    </RailActiveContext.Provider>
  );
}

/** Read the rail's optimistic active state. Throws outside the provider. */
export function useRailActive(): RailActiveContextValue {
  const ctx = useContext(RailActiveContext);
  if (!ctx) {
    throw new Error('useRailActive must be used within a <RailActiveProvider>.');
  }
  return ctx;
}
