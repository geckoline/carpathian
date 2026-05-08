import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

  it('returns initial value if nothing in storage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from storage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('updates value and storage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'init'));
    act(() => result.current[1]('new'));
    expect(result.current[0]).toBe('new');
    expect(localStorage.getItem('test-key')).toBe('"new"');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => result.current[1]((prev: number) => prev + 1));
    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('count')).toBe('1');
  });

  it('falls back to initial value on corrupted JSON', () => {
    localStorage.setItem('test-key', 'not-json');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
