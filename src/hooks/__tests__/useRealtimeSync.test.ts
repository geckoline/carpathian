import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtimeSync } from '../useRealtimeSync';

const mockStore = vi.hoisted(() => (globalThis as any).__createMockAppStore());
const storeActions = mockStore.useAppStore();

vi.mock('@/store/appStore', () => {
  const fn: any = vi.fn((selector: any) => {
    const state = storeActions;
    return selector ? selector(state) : state;
  });
  fn.getState = () => storeActions;
  return { useAppStore: fn };
});

const mockLoadAppData = vi.hoisted(() => vi.fn());

vi.mock('@/services/loadAppData', () => ({
  loadAppData: mockLoadAppData,
}));

describe('useRealtimeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAppData.mockResolvedValue({ projects: [], experts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads projects and experts on mount', async () => {
    mockLoadAppData.mockResolvedValue({
      projects: [{ id: '1', name: 'Test' }],
      experts: [{ id: '2', name: 'Expert' }],
    });

    renderHook(() => useRealtimeSync());

    expect(storeActions.setLoading).toHaveBeenCalledWith(true);

    await vi.waitFor(() => {
      expect(storeActions.setProjects).toHaveBeenCalledWith([{ id: '1', name: 'Test' }]);
      expect(storeActions.setExperts).toHaveBeenCalledWith([{ id: '2', name: 'Expert' }]);
      expect(storeActions.setLoading).toHaveBeenCalledWith(false);
    });
  });

  it('sets error when loadAppData fails', async () => {
    mockLoadAppData.mockRejectedValueOnce(new Error('Network failure'));

    renderHook(() => useRealtimeSync());

    await vi.waitFor(() => {
      expect(storeActions.setError).toHaveBeenCalledWith('Network failure');
      expect(storeActions.setLoading).toHaveBeenCalledWith(false);
    });
  });

  it('does not update state after unmount', async () => {
    mockLoadAppData.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    const { unmount } = renderHook(() => useRealtimeSync());
    unmount();

    const capturedSetProjects = storeActions.setProjects.mock.calls.length;
    expect(capturedSetProjects).toBe(0);
  });

  it('updates online status on online event', () => {
    renderHook(() => useRealtimeSync());

    act(() => { window.dispatchEvent(new Event('online')); });
    expect(storeActions.setOnlineStatus).toHaveBeenCalledWith(true);
  });

  it('updates online status on offline event', () => {
    renderHook(() => useRealtimeSync());

    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(storeActions.setOnlineStatus).toHaveBeenCalledWith(false);
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useRealtimeSync());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
