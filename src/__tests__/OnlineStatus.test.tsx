import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAppStore } from '@/store/appStore';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
  });

  afterEach(() => {
    useAppStore.setState({ isOnline: true });
  });

  it('tracks online/offline events', () => {
    const { result } = renderHook(() => useOnlineStatus());

    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(result.current).toBe(false);
    expect(useAppStore.getState().isOnline).toBe(false);

    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(result.current).toBe(true);
    expect(useAppStore.getState().isOnline).toBe(true);
  });
});
