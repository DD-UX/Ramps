/**
 * The palette's tuning constants, in one place so the search's cost and the
 * list's length are stated rather than buried in the component.
 */

/**
 * How long the field rests before a query hits the server. Longer than the
 * list toolbars' 300ms on purpose: those debounce a URL replace over data the
 * client already holds, while every pause here is a real round-trip, and a
 * palette is typed at full speed from muscle memory ("⌘K acme ↵").
 */
export const PALETTE_SEARCH_DEBOUNCE_MS = 200;

/**
 * A term shorter than this doesn't search. One or two characters match most of
 * the table — a list of "results" that is really "everything" teaches nothing,
 * and costs a query per keystroke to say it.
 */
export const PALETTE_MIN_QUERY_LENGTH = 2;

/**
 * Rows fetched per search. The palette is a JUMP list, not a report: past a
 * screenful the right move is to refine the term, or open Bill Pay and use the
 * real table with its pager and tabs. `pageSize` is sent to the server, so the
 * cap is a smaller QUERY rather than a big query trimmed on the client.
 */
export const PALETTE_BILL_RESULT_LIMIT = 6;
