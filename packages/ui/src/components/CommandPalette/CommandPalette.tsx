'use client';

import { CornerDownLeft, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useClickAway } from '../../hooks/useClickAway';
import { cn } from '../../lib/cn';
import { Kbd } from '../Kbd/Kbd';
import { Spinner } from '../Spinner/Spinner';

/**
 * CommandPalette — the ⌘K overlay: one field, grouped results, keyboard-first.
 *
 * The shape is the genre's (Linear/Raycast/Spotlight): a light-scrim sheet held
 * near the TOP of the viewport rather than centred, because the list grows
 * downward and a centred panel would shift the field under the user's eye every
 * time the result count changed. The kit's Modal is the centred confirmation
 * dialog and stays that; this is its top-anchored, list-shaped sibling, so the
 * two share the scrim recipe (light `white/75` wash, never a dark dim) and the
 * `useClickAway` dismissal contract, but not the layout.
 *
 * THE ANCHOR RULE. A navigational item renders as a REAL `<a href>` — via the
 * injected `linkComponent`, the same framework-free seam SideMenu uses so this
 * package never imports a router. It matters beyond prefetch: the app's
 * unsaved-changes guard intercepts navigation from a document-level CAPTURE
 * click listener, so a destination reached by `router.push` would slip past the
 * "you have unsaved edits" gate entirely. Keeping items as anchors means the
 * palette inherits that protection for free. It is also why ENTER does not call
 * a handler: it calls `.click()` on the active row's element, so the keyboard
 * and the mouse take one identical path through the guard, the router, and
 * prefetch — one code path, one set of bugs.
 *
 * SELECTION IS THE CALLER'S. This component owns the field, the active index,
 * the keyboard contract and the chrome; it owns no data. Groups arrive already
 * filtered (`groups`), because the only honest filter for a server-searched
 * list lives on the server — a client `.filter()` over one fetched page would
 * silently hide matches and re-teach the exact lie a palette exists to remove.
 *
 * A11y: the field is a `combobox` owning a `listbox`, and the active row is
 * pointed at with `aria-activedescendant` rather than focus — focus never
 * leaves the input, so typing stays uninterrupted while ↑/↓ walk the list.
 */

/**
 * The props the palette hands whatever element renders a navigational row. A
 * plain `<a>` satisfies it; so does `next/link`. Injected rather than imported
 * so `@ramps/ui` stays router-free (see SideMenu's identical seam).
 */
export type CommandPaletteLinkProps = PropsWithChildren<{
  href: string;
  className?: string;
  id?: string;
  role?: 'option';
  'aria-selected'?: boolean;
  'data-command-item'?: string;
  onClick?: () => void;
  onPointerMove?: () => void;
}>;

export type CommandPaletteLinkComponent = ComponentType<CommandPaletteLinkProps>;

/** The fallback row link — a native anchor (full page load, no prefetch). */
const DefaultLink: CommandPaletteLinkComponent = ({ href, children, ...rest }) => (
  <a href={href} {...rest}>
    {children}
  </a>
);

export interface CommandPaletteItem {
  /** Stable identity — also the React key. */
  id: string;
  /** The row's primary line. */
  label: ReactNode;
  /** Optional second line, hushed (invoice number, vendor, due date…). */
  description?: ReactNode;
  /** Leading glyph. */
  icon?: ReactNode;
  /** Trailing slot — an amount, a StatusPill, a shortcut hint. */
  meta?: ReactNode;
  /**
   * Destination. Present → the row is an ANCHOR (see the anchor rule above).
   * Absent → the row is a button and `onSelect` is the whole behaviour.
   */
  href?: string;
  /** Fired on activation. On an anchor this runs BESIDE the navigation. */
  onSelect?: () => void;
}

export interface CommandPaletteGroup {
  id: string;
  /** Section heading above the rows ("Bills", "Go to", "Actions"). */
  heading: string;
  items: CommandPaletteItem[];
}

export interface CommandPaletteProps {
  open: boolean;
  /** Called on Esc, a scrim click, or after a row is activated. */
  onClose: () => void;
  /** The field's value — controlled, because the caller debounces it into a query. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Already-filtered result groups. Empty groups are dropped, not rendered. */
  groups: CommandPaletteGroup[];
  /** A search is in flight — swaps the leading glyph for a spinner. */
  loading?: boolean;
  placeholder?: string;
  /** Shown when there are no rows. Caller-owned so it can name the query. */
  emptyMessage?: ReactNode;
  /** The app's router link. Omit and rows fall back to full-reload anchors. */
  linkComponent?: CommandPaletteLinkComponent;
  className?: string;
}

export function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  groups,
  loading = false,
  placeholder = 'Search for anything',
  emptyMessage,
  linkComponent,
  className,
}: CommandPaletteProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  /**
   * The active row is tracked by ITEM ID, never by index, and the index is
   * derived from it. That one choice removes both of the resets an
   * index-keyed palette needs: when the query changes, or the list shrinks,
   * the remembered id simply isn't in the new list and the lookup falls back
   * to the first row. No effect fires, so there is no frame where the
   * highlight points past the end and Enter activates nothing.
   */
  const [activeId, setActiveId] = useState<string | null>(null);

  const LinkComponent = linkComponent ?? DefaultLink;

  // Drop empty groups here rather than asking every caller to — a group with no
  // rows would otherwise render a heading over nothing.
  const visibleGroups = useMemo(() => groups.filter((g) => g.items.length > 0), [groups]);

  // The flat row order IS the keyboard order: ↑/↓ walk across group boundaries
  // as one list, so a user never has to know the grouping exists.
  const flatItems = useMemo(() => visibleGroups.flatMap((g) => g.items), [visibleGroups]);

  const itemId = useCallback((index: number) => `${baseId}-item-${index}`, [baseId]);

  // Derived, per the note on `activeId`: an unknown/absent id means the top row.
  const activeIndex = useMemo(() => {
    const found = flatItems.findIndex((item) => item.id === activeId);
    return found >= 0 ? found : 0;
  }, [flatItems, activeId]);

  /** Move the highlight by offset, wrapping — a palette list is short and cyclic movement beats dead-ending. */
  const move = useCallback(
    (offset: number) => {
      const count = flatItems.length;
      if (count === 0) return;
      const next = (((activeIndex + offset) % count) + count) % count;
      setActiveId(flatItems[next]?.id ?? null);
    },
    [activeIndex, flatItems],
  );

  useClickAway(panelRef, onClose, { enabled: open });

  // Lock body scroll while open — the page sits frozen under the wash, same as
  // the Modal's contract.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus the field on open. Deferred a frame because the panel is mounted by
  // AnimatePresence: focusing in the same tick can land before the node is in
  // the document, which silently no-ops.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Keep the active row on screen. `block: 'nearest'` scrolls the minimum
  // needed, so walking down a long list creeps instead of jumping.
  useEffect(() => {
    if (!open) return;
    const rows = listRef.current?.querySelectorAll('[data-command-item]');
    rows?.[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  /**
   * Activate the current row by CLICKING its element — never by calling the
   * handler directly. See the anchor rule: this is what keeps Enter and the
   * mouse on one path through the navigation guard and the router.
   */
  const activate = useCallback(() => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-command-item]');
    rows?.[activeIndex]?.click();
  }, [activeIndex]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const count = flatItems.length;
      if (count === 0) return;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          move(1);
          return;
        case 'ArrowUp':
          event.preventDefault();
          move(-1);
          return;
        case 'Home':
          event.preventDefault();
          setActiveId(flatItems[0]?.id ?? null);
          return;
        case 'End':
          event.preventDefault();
          setActiveId(flatItems[count - 1]?.id ?? null);
          return;
        case 'Enter':
          event.preventDefault();
          activate();
          return;
        default:
      }
    },
    [activate, flatItems, move],
  );

  const listboxId = `${baseId}-listbox`;
  let flatIndex = -1;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          data-testid="command-palette-overlay"
          className="inset-0 bg-white/75 p-rui-4 fixed z-50 flex items-start justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
        >
          {/* Held near the top: the list grows downward, so anchoring the FIELD
              keeps it still while results stream in underneath. */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            data-testid="command-palette"
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.98,
              y: -8,
              transition: { duration: 0.12, ease: 'easeIn' },
            }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'max-w-2xl rounded-square border-bone bg-white shadow-popover mt-[10vh] flex max-h-[60vh] w-full flex-col overflow-hidden border',
              className,
            )}
          >
            {/* The field. Borderless and full-bleed — the PANEL is the input's
                frame, so a second border would read as a box inside a box. */}
            <div className="gap-rui-3 border-bone px-rui-4 flex shrink-0 items-center border-b">
              <span className="text-hushed shrink-0" aria-hidden>
                {loading ? <Spinner size="sm" /> : <Search size={18} />}
              </span>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-label="Search"
                {...(flatItems.length > 0 ? { 'aria-activedescendant': itemId(activeIndex) } : {})}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                className="py-rui-4 text-ink placeholder:text-hushed min-w-0 text-base flex-1 bg-transparent outline-none"
              />
              <Kbd className="shrink-0">Esc</Kbd>
            </div>

            {/* Results. One scroll region so the field and the hint bar stay put. */}
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="Results"
              className="p-rui-2 min-h-0 flex-1 overflow-y-auto"
            >
              {flatItems.length === 0 ? (
                <p className="px-rui-3 py-rui-6 text-sm text-hushed text-center">
                  {emptyMessage ?? 'No results.'}
                </p>
              ) : (
                visibleGroups.map((group) => (
                  <div key={group.id} className="mb-rui-2 last:mb-0">
                    <p
                      // Presentational: the listbox's children are its options,
                      // and a heading in the middle of them would be announced
                      // as one. The grouping is a VISUAL aid here.
                      role="presentation"
                      className="px-rui-3 pt-rui-2 pb-rui-1 text-xs font-heading text-hushed"
                    >
                      {group.heading}
                    </p>
                    {group.items.map((item) => {
                      flatIndex += 1;
                      return (
                        <CommandPaletteRow
                          key={item.id}
                          item={item}
                          id={itemId(flatIndex)}
                          active={flatIndex === activeIndex}
                          onActivate={setActiveId}
                          onClose={onClose}
                          LinkComponent={LinkComponent}
                        />
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Hint bar — the shortcuts spelled out, because a keyboard-first
                surface that hides its keys is only half-usable. */}
            <div className="gap-rui-4 border-bone px-rui-4 py-rui-2 text-xs text-hushed bg-limestone flex shrink-0 items-center border-t">
              <span className="gap-rui-1 flex items-center">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                to navigate
              </span>
              <span className="gap-rui-1 flex items-center">
                <Kbd>
                  <CornerDownLeft size={11} aria-hidden />
                </Kbd>
                to open
              </span>
              <span className="gap-rui-1 flex items-center">
                <Kbd>Esc</Kbd>
                to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CommandPaletteRowProps {
  item: CommandPaletteItem;
  id: string;
  active: boolean;
  onActivate: (id: string) => void;
  onClose: () => void;
  LinkComponent: CommandPaletteLinkComponent;
}

/**
 * One result row. Anchor when the item names a destination, button otherwise —
 * the branch is the whole reason `href` exists as a separate field from
 * `onSelect` (see the anchor rule on {@link CommandPalette}).
 *
 * Hovering ADOPTS the row as active rather than painting a separate hover
 * state: with one highlight for both pointer and keyboard there is never a
 * moment where two rows look selected and Enter picks the one you weren't
 * looking at. `onPointerMove` (not `onPointerEnter`) does it, so a list that
 * scrolls under a stationary cursor doesn't steal the keyboard's selection.
 */
function CommandPaletteRow({
  item,
  id,
  active,
  onActivate,
  onClose,
  LinkComponent,
}: CommandPaletteRowProps) {
  const className = cn(
    // `isolate` is LOAD-BEARING, not decoration. The highlight below is a
    // `-z-10` fill, and `relative` alone does not open a stacking context — a
    // negatively-stacked child then paints in the nearest ancestor that does
    // (the `fixed z-50` scrim), which puts it BEHIND the panel's own white
    // background. The row still moved and `aria-activedescendant` still
    // tracked it; there was simply nothing to see, so ↑/↓ read as broken.
    // `isolation: isolate` pins the fill inside this row — above the panel's
    // white, below the row's content. Same fix, same reason, as the detail
    // rail's active card.
    'gap-rui-3 rounded-square px-rui-3 py-rui-2 relative isolate flex w-full items-center text-left',
    'cursor-pointer no-underline',
  );

  const body = (
    <>
      {/* The highlight is a SHARED layout element: one lozenge that glides
          between rows instead of nine that blink. `layoutId` is the same
          mechanism the detail rail's active pill uses. */}
      {active && (
        <motion.span
          layoutId="command-palette-active"
          data-testid="command-palette-highlight"
          className="bg-limestone rounded-square inset-0 absolute -z-10"
          transition={{ type: 'spring', stiffness: 700, damping: 45 }}
        />
      )}
      {item.icon && (
        <span className="text-hushed size-4 flex shrink-0 items-center justify-center" aria-hidden>
          {item.icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="text-sm text-ink block truncate">{item.label}</span>
        {item.description && (
          <span className="text-xs text-hushed block truncate">{item.description}</span>
        )}
      </span>
      {item.meta && <span className="shrink-0">{item.meta}</span>}
    </>
  );

  const shared = {
    id,
    role: 'option' as const,
    'aria-selected': active,
    'data-command-item': '',
    onPointerMove: () => onActivate(item.id),
  };

  if (item.href !== undefined) {
    return (
      <LinkComponent
        {...shared}
        href={item.href}
        className={className}
        onClick={() => {
          item.onSelect?.();
          onClose();
        }}
      >
        {body}
      </LinkComponent>
    );
  }

  return (
    <button
      {...shared}
      type="button"
      className={className}
      onClick={() => {
        item.onSelect?.();
        onClose();
      }}
    >
      {body}
    </button>
  );
}
