'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

/**
 * CommandPaletteContext — the palette's session state (is it open, what's
 * typed), shared between the overlay (mounted once, at the app root) and the
 * triggers that open it (the top bar's search field today; any "⌘K" affordance
 * tomorrow).
 *
 * It is a context rather than local state because the two halves are far apart
 * in the tree ON PURPOSE. The overlay is mounted at the ROOT, not in the app
 * shell, because `(shell)/` and `(detail)/` are sibling route groups: a palette
 * living in the shell layout would be missing from every bill detail page —
 * the screen where jumping to another bill is the most useful thing ⌘K can do.
 * The trigger, meanwhile, has to sit in the top bar, which only the shell has.
 * One provider above both lets each live where it belongs.
 *
 * The QUERY lives here too, so `openPalette` can clear it in the same update
 * that opens the sheet. Keeping it in the overlay would mean resetting it from
 * an effect watching `open` — a set-state-in-effect that flashes the previous
 * term for a frame, and re-runs the search for it. Owning both here makes
 * "opening is a fresh search" a single, effect-free transition.
 */
interface CommandPaletteContextValue {
  open: boolean;
  query: string;
  setQuery: (query: string) => void;
  openPalette: () => void;
  closePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const openPalette = useCallback(() => {
    setQuery('');
    setOpen(true);
  }, []);

  /**
   * Stable by construction, and that stability is load-bearing: the overlay
   * closes itself from an effect keyed on the pathname, so a `closePalette`
   * that changed identity on every keystroke would re-run that effect and slam
   * the sheet shut mid-type. The query is deliberately NOT cleared here — the
   * sheet animates out over ~120ms and emptying it mid-exit would blank the
   * list the user is still looking at; `openPalette` clears it instead.
   */
  const closePalette = useCallback(() => setOpen(false), []);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ open, query, setQuery, openPalette, closePalette }),
    [open, query, openPalette, closePalette],
  );

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

/**
 * Read the palette's session state. Throws when used outside the provider —
 * a trigger that silently does nothing is exactly the dead affordance this
 * feature exists to delete.
 */
export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>');
  }
  return context;
}
