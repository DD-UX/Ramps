import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCommandPlusKey } from './useCommandPlusKey';

/**
 * useCommandPlusKey binds a document keydown listener that fires only on the
 * "command + <key>" chord (⌘ on Apple via metaKey, Ctrl elsewhere via ctrlKey),
 * and cleans itself up via an AbortController. These tests drive real
 * KeyboardEvents at `document` and assert the handler fires exactly when it
 * should — and never after unmount / while disabled.
 */
function press(key: string, mods: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...mods }));
}

describe('useCommandPlusKey', () => {
  it('fires on Cmd (metaKey) + the key', () => {
    const handler = vi.fn();
    renderHook(() => useCommandPlusKey('k', handler));

    press('k', { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fires on Ctrl (ctrlKey) + the key', () => {
    const handler = vi.fn();
    renderHook(() => useCommandPlusKey('k', handler));

    press('k', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('is case-insensitive on the key (Shift-held ⌘K still fires)', () => {
    const handler = vi.fn();
    renderHook(() => useCommandPlusKey('k', handler));

    press('K', { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores the key without the command modifier', () => {
    const handler = vi.fn();
    renderHook(() => useCommandPlusKey('k', handler));

    press('k');
    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores the command modifier with a different key', () => {
    const handler = vi.fn();
    renderHook(() => useCommandPlusKey('k', handler));

    press('j', { metaKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes the originating event to the handler', () => {
    const handler = vi.fn();
    renderHook(() => useCommandPlusKey('k', handler));

    press('k', { metaKey: true });
    expect(handler.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
  });

  it('stops firing after unmount (AbortController tears the listener down)', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useCommandPlusKey('k', handler));

    unmount();
    press('k', { metaKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not bind while disabled', () => {
    const handler = vi.fn();
    renderHook(() => useCommandPlusKey('k', handler, false));

    press('k', { metaKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('uses the latest handler without re-binding on every render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ h }) => useCommandPlusKey('k', h), {
      initialProps: { h: first },
    });

    rerender({ h: second });
    press('k', { metaKey: true });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
