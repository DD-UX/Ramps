'use client';

import {
  CommandPalette,
  type CommandPaletteGroup,
  type CommandPaletteItem,
} from '@ramps/ui/CommandPalette';
import { ArrowRight, ReceiptText } from '@ramps/ui/icons';
import { Money } from '@ramps/ui/Money';
import { StatusPill } from '@ramps/ui/StatusPill';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import { NAV_SECTIONS } from '@/features/common/constants/nav.constants';
import { useCommandPlusKey } from '@/features/common/hooks/useCommandPlusKey';

import {
  PALETTE_MIN_QUERY_LENGTH,
  PALETTE_SEARCH_DEBOUNCE_MS,
} from '../constants/palette.constants';
import { useCommandPalette } from '../context/CommandPalette.context';
import {
  billResultDescription,
  billResultLabel,
  isSearchableQuery,
  matchNavItems,
} from '../helpers/palette-results.helpers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePaletteBills } from '../hooks/usePaletteBills';

/**
 * CommandPaletteHost — the app's ⌘K surface: the kit's CommandPalette wired to
 * this product's data, mounted ONCE at the root so it exists on every screen.
 *
 * It closes the last dead affordance in the shell. The top bar's field used to
 * be a real input that ⌘K focused and that searched nothing — a control that
 * looked finished and wasn't. This is the search that field was pretending to
 * be, and the field itself becomes a button that opens it.
 *
 * TWO RESULT FAMILIES, TWO HONEST SOURCES (see palette-results.helpers):
 * bills come from the SERVER (`GET /api/bills?q=` with no status filter, so
 * one query reaches every category), destinations are matched locally against
 * the nav's built routes. Typing repaints the field instantly while the SWR
 * key trails it by {@link PALETTE_SEARCH_DEBOUNCE_MS}, so a fast typist pays
 * for pauses, not keystrokes.
 *
 * The overflow row matters as much as the results. Six rows is a JUMP list,
 * not a report, so when the server says there are more the palette says so and
 * hands the query to the real table (`/bills?q=…`, whose default Overview tab
 * is unfiltered — the same population, so the count it promises is the count
 * the table shows). Silently truncating would re-teach the exact lie the
 * server-side search was built to remove.
 *
 * CLOSING is driven by the NAVIGATION, not the click. Rows are `next/link`
 * anchors, so the unsaved-changes guard's capture listener can veto one — and
 * when it does it calls `stopPropagation()`, which means the row's own
 * `onClick` never runs and the palette correctly stays open UNDER the "Unsaved
 * changes" modal (cancel it and your query is still there). The pathname
 * watcher below is what closes the palette once a navigation actually commits,
 * including the deferred one the guard performs after Save/Leave.
 */
export function CommandPaletteHost() {
  const { open, query, setQuery, openPalette, closePalette } = useCommandPalette();
  const pathname = usePathname();

  const debouncedQuery = useDebouncedValue(query, PALETTE_SEARCH_DEBOUNCE_MS);
  const { bills, total, loading } = usePaletteBills(debouncedQuery);

  // ⌘K toggles: the chord that opened the sheet is the most obvious way to
  // dismiss it, and `preventDefault` keeps the browser's own ⌘K (address-bar
  // search) out of the way either way.
  useCommandPlusKeyToggle(open, openPalette, closePalette);

  // A committed route change closes the palette. Also covers the same-tab
  // "click a row you're already on" case harmlessly (no pathname change, but
  // the row's onClick already closed it).
  useEffect(() => {
    closePalette();
  }, [pathname, closePalette]);

  const trimmed = query.trim();
  const searchable = isSearchableQuery(trimmed);
  // The list is only truly "searching" while the DEBOUNCED term still lags the
  // typed one — otherwise a settled result set would flicker its spinner back
  // on with every keystroke.
  const pending = loading || (searchable && debouncedQuery.trim() !== trimmed);

  const groups = useMemo<CommandPaletteGroup[]>(() => {
    const result: CommandPaletteGroup[] = [];

    if (searchable) {
      const items: CommandPaletteItem[] = bills.map((bill) => ({
        id: bill.id,
        label: billResultLabel(bill),
        description: billResultDescription(bill),
        icon: <ReceiptText size={16} />,
        href: `/bills/${bill.id}`,
        meta: (
          <span className="gap-rui-2 flex items-center">
            <StatusPill status={bill.status} />
            <Money cents={bill.amount_cents} currency={bill.currency} align="right" />
          </span>
        ),
      }));

      // The honest overflow row — see the note on truncation above.
      if (total > items.length) {
        items.push({
          id: 'palette-bills-overflow',
          label: `See all ${total} matches in Bill Pay`,
          icon: <ArrowRight size={16} />,
          href: `/bills?q=${encodeURIComponent(trimmed)}`,
        });
      }

      result.push({ id: 'bills', heading: 'Bills', items });
    }

    // Destinations always show: with nothing typed the palette is a menu, and
    // the shortest path to Vendors is worth listing even when no bill matches.
    const navItems = matchNavItems(NAV_SECTIONS, query).map((item) => {
      const Icon = item.icon;
      return {
        id: `nav-${item.href}`,
        label: item.label,
        // `NavIcon` is typed by its intrinsic SVG sizing props, not lucide's
        // `size` sugar — the nav config stays provider-agnostic.
        icon: <Icon width={16} height={16} />,
        href: item.href,
      };
    });
    result.push({ id: 'nav', heading: 'Go to', items: navItems });

    return result;
  }, [bills, query, searchable, total, trimmed]);

  return (
    <CommandPalette
      open={open}
      onClose={closePalette}
      query={query}
      onQueryChange={setQuery}
      groups={groups}
      loading={pending}
      linkComponent={Link}
      placeholder="Search bills, or jump to a page"
      emptyMessage={
        searchable
          ? `No bills or pages match “${trimmed}”.`
          : `Type at least ${PALETTE_MIN_QUERY_LENGTH} characters to search bills.`
      }
    />
  );
}

/**
 * The ⌘K binding, split out so the host body reads as data-flow. Toggling
 * needs the CURRENT `open`, which is why it can't be a bare `openPalette`
 * reference: pressing the chord twice should put you back where you started.
 */
function useCommandPlusKeyToggle(open: boolean, onOpen: () => void, onClose: () => void) {
  const handler = useCallback(
    (event: KeyboardEvent) => {
      // Stop the browser's own ⌘K/Ctrl+K (address-bar search in some browsers).
      event.preventDefault();
      if (open) onClose();
      else onOpen();
    },
    [open, onClose, onOpen],
  );
  useCommandPlusKey('k', handler);
}
