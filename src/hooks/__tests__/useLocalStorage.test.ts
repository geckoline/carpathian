import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('writes value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => result.current[1]('new-value'));
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('counter')).toBe('1');
  });

  it('handles JSON parse errors gracefully', () => {
    localStorage.setItem('bad-json', '{invalid');
    const { result } = renderHook(() => useLocalStorage('bad-json', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('handles storage events from other tabs', () => {
    const { result } = renderHook(() => useLocalStorage('synced-key', 'old'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'synced-key',
        newValue: JSON.stringify('new-value'),
      }));
    });
    expect(result.current[0]).toBe('new-value');
  });
});
