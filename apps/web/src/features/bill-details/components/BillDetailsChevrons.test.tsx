import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChevronState } from '../helpers/chevron.helpers';
import { BillDetailsChevrons } from './BillDetailsChevrons';

/**
 * The steppers' render states and the ←/→ document binding, pinned:
 *
 * - a settled target renders a real anchor (href to the landing BILL) whose
 *   label is the landing category's NAME with the Kbd hint baked in; the
 *   clamp renders the SAME Kbd keycap faded out (aria-disabled, opacity dim)
 *   with no anchor — one key shape in both states, the fade saying "inert";
 *   an unsettled side renders neither (skeleton).
 * - ArrowLeft / ArrowRight click the matching stepper's own anchor — so the
 *   optimistic `flipCategory` fires through the SAME React onClick a mouse
 *   click uses (one code path, one guard seam).
 * - the shared typing gate: an arrow pressed inside a field does nothing —
 *   fields own their caret.
 *
 * The rail context is mocked at the hook seam; `next/link` is flattened to a
 * plain anchor (no app router in jsdom) with a quiet `useLinkStatus`.
 */
const rail = vi.hoisted(() => ({
  chevronPrev: { target: null, settled: false } as ChevronState,
  chevronNext: { target: null, settled: false } as ChevronState,
  flipCategory: vi.fn(),
}));

vi.mock('../context/BillRail.context', () => ({
  useBillRail: () => rail,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    prefetch: _prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

const target = (code: string, billId: string): ChevronState => ({
  settled: true,
  target: {
    tab: { id: code, name: code, code, statuses: [], sort_order: 0, created_by: null },
    billId,
  },
});

/** Swallow the anchors' default navigation — jsdom can't leave the document. */
const swallowClicks = (event: MouseEvent) => event.preventDefault();

const pressArrow = (key: 'ArrowLeft' | 'ArrowRight', targetEl: EventTarget = document) =>
  targetEl.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

beforeEach(() => {
  document.addEventListener('click', swallowClicks);
  rail.flipCategory.mockClear();
  rail.chevronPrev = target('drafts', 'd1');
  rail.chevronNext = target('for_payment', 'p1');
});

afterEach(() => {
  document.removeEventListener('click', swallowClicks);
});

describe('BillDetailsChevrons', () => {
  it('renders settled targets as real anchors named after the landing category, Kbd baked in', () => {
    render(<BillDetailsChevrons />);
    const prev = screen.getByRole('link', { name: /Previous category: drafts/ });
    const next = screen.getByRole('link', { name: /Next category: for_payment/ });
    expect(prev).toHaveAttribute('href', '/bills/d1');
    expect(next).toHaveAttribute('href', '/bills/p1');
    // The label IS the landing category's name, hint on the outer edge.
    expect(prev).toHaveTextContent('←drafts');
    expect(next).toHaveTextContent('for_payment→');
    expect(prev.querySelector('kbd')).not.toBeNull();
    expect(next.querySelector('kbd')).not.toBeNull();
  });

  it('renders the clamp as the same Kbd keycap, faded out — the key shape survives, inert', () => {
    rail.chevronNext = { target: null, settled: true };
    render(<BillDetailsChevrons />);
    const clamp = screen.getByLabelText('Next category');
    expect(clamp).toHaveAttribute('aria-disabled', 'true');
    // The verdict IS a keycap — the live stepper's chip, dimmed, not a bare arrow.
    expect(clamp.tagName).toBe('KBD');
    expect(clamp).toHaveClass('opacity-60');
    expect(clamp).toHaveTextContent('→');
    expect(screen.queryByRole('link', { name: /Next category/ })).toBeNull();
  });

  it('ArrowRight / ArrowLeft click their stepper — flipCategory fires via the anchor onClick', () => {
    render(<BillDetailsChevrons />);
    pressArrow('ArrowRight');
    expect(rail.flipCategory).toHaveBeenCalledWith(expect.objectContaining({ billId: 'p1' }));
    pressArrow('ArrowLeft');
    expect(rail.flipCategory).toHaveBeenCalledWith(expect.objectContaining({ billId: 'd1' }));
  });

  it('a clamped direction has no anchor — the key press is a no-op', () => {
    rail.chevronPrev = { target: null, settled: true };
    render(<BillDetailsChevrons />);
    pressArrow('ArrowLeft');
    expect(rail.flipCategory).not.toHaveBeenCalled();
  });

  it('arrows pressed while typing in a field are the field’s — no hop', () => {
    render(
      <div>
        <input aria-label="memo" />
        <BillDetailsChevrons />
      </div>,
    );
    pressArrow('ArrowRight', screen.getByLabelText('memo'));
    expect(rail.flipCategory).not.toHaveBeenCalled();
  });
});
