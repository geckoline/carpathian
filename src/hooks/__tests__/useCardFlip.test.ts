// src/hooks/__tests__/useCardFlip.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardFlip } from '../useCardFlip';

describe('useCardFlip', () => {
  it('starts unflipped and not flipping', () => {
    const { result } = renderHook(() => useCardFlip());
    expect(result.current.isFlipped).toBe(false);
    expect(result.current.isFlipping).toBe(false);
  });

  it('flips when toggle is called', () => {
    const { result } = renderHook(() => useCardFlip());
    act(() => { result.current.toggle(); });
    expect(result.current.isFlipped).toBe(true);
    expect(result.current.isFlipping).toBe(true);
  });

  it('toggles back when called again', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCardFlip({ durationMs: 100 }));
    act(() => { result.current.toggle(); });
    expect(result.current.isFlipped).toBe(true);
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { result.current.toggle(); });
    expect(result.current.isFlipped).toBe(false);
    vi.useRealTimers();
  });

  it('calls onFlip callback when flipped', () => {
    const onFlip = vi.fn();
    const { result } = renderHook(() => useCardFlip({ onFlip }));
    act(() => { result.current.toggle(); });
    expect(onFlip).toHaveBeenCalledWith(true);
  });

  it('respects custom duration', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCardFlip({ durationMs: 100 }));
    act(() => { result.current.toggle(); });
    expect(result.current.isFlipping).toBe(true);
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.isFlipping).toBe(false);
    vi.useRealTimers();
  });
});
