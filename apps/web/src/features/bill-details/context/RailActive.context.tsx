'use client';

import { LayoutGroup } from 'motion/react';
import { createContext, type ReactNode, useContext, useState } from 'react';

/**
 * The rail's OPTIMISTIC active record — which card carries the floating
 * limestone background right now.
 *
 * Rail hops are server-side route changes, so there's a beat between the
 * click (or ↑/↓) and the next screen. Instead of the highlight sitting on the
 * old card through that beat, every rail link reports its target here on
 * click and the background GLIDES to it immediately (shared-layout `motion`
 * span in {@link BillDetailsRailItem}) — the user feels the move between
 * records before the app finishes loading the next one.
 *
 * The provider lives in the (unkeyed, state-preserved) rail, so the glide
 * survives the navigation; when the new page lands, the server-known
 * `initialActiveId` re-syncs the state — a no-op after a normal hop, a
 * correction if a navigation was vetoed elsewhere or never completed. The
 * `LayoutGroup` scopes the cards' shared `layoutId` to this rail.
 */
interface RailActiveContextValue {
  activeId: string;
  setActiveId: (id: string) => void;
}

const RailActiveContext = createContext<RailActiveContextValue | null>(null);

export interface RailActiveProviderProps {
  /** The server-rendered truth: the id of the bill this page is showing. */
  initialActiveId: string;
  children: ReactNode;
}

export function RailActiveProvider({ initialActiveId, children }: RailActiveProviderProps) {
  const [activeId, setActiveId] = useState(initialActiveId);

  // Re-sync on every completed navigation: the provider instance persists
  // across `/bills/:id` renders, so the prop — not a remount — is what
  // carries the new page's truth in. Render-time adjustment (React's
  // "derive state from props" pattern), not an effect — no extra paint of
  // the stale highlight.
  const [prevInitialActiveId, setPrevInitialActiveId] = useState(initialActiveId);
  if (prevInitialActiveId !== initialActiveId) {
    setPrevInitialActiveId(initialActiveId);
    setActiveId(initialActiveId);
  }

  return (
    <RailActiveContext.Provider value={{ activeId, setActiveId }}>
      <LayoutGroup>{children}</LayoutGroup>
    </RailActiveContext.Provider>
  );
}

/** Read the rail's optimistic active id. Throws outside the provider. */
export function useRailActive(): RailActiveContextValue {
  const ctx = useContext(RailActiveContext);
  if (!ctx) {
    throw new Error('useRailActive must be used within a <RailActiveProvider>.');
  }
  return ctx;
}
