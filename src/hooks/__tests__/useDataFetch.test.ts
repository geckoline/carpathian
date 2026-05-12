import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDataFetch } from '../useDataFetch';
import { useAppStore } from '@/store/appStore';
import { loadAppData } from '@/services/loadAppData';

vi.mock('@/services/loadAppData', () => ({
  loadAppData: vi.fn(),
}));

describe('useDataFetch', () => {
  const project = { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active' as const, field: 'Bio', description: 'A valid test project description here', location: 'Loc', yearRange: '2021-2025', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Test Expert', lat: 1, lng: 1, isCitizenScience: true };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ data: { projects: [], experts: [], loading: false, error: null } });
  });

  it('sets loading true, fetches data, then sets loading false', async () => {
    vi.mocked(loadAppData).mockResolvedValue({ projects: [project], experts: [] });

    renderHook(() => useDataFetch());

    expect(useAppStore.getState().data.loading).toBe(true);

    await waitFor(() => {
      expect(useAppStore.getState().data.loading).toBe(false);
    });

    expect(useAppStore.getState().data.projects).toHaveLength(1);
    expect(useAppStore.getState().data.error).toBeNull();
  });

  it('sets error state on fetch failure', async () => {
    vi.mocked(loadAppData).mockRejectedValue(new Error('Network error'));

    renderHook(() => useDataFetch());

    await waitFor(() => {
      expect(useAppStore.getState().data.error).toBe('Network error');
    });
    expect(useAppStore.getState().data.loading).toBe(false);
  });

  it('exposes retry function that re-fetches', async () => {
    vi.mocked(loadAppData).mockRejectedValueOnce(new Error('First fail'));

    const { result } = renderHook(() => useDataFetch());
    await waitFor(() => expect(useAppStore.getState().data.error).toBeTruthy());

    vi.mocked(loadAppData).mockResolvedValue({ projects: [project], experts: [] });

    act(() => result.current.retry());

    await waitFor(() => expect(useAppStore.getState().data.loading).toBe(false));
    expect(useAppStore.getState().data.projects).toHaveLength(1);
    expect(useAppStore.getState().data.error).toBeNull();
  });

  it('reports isRetrying during fetch', async () => {
    vi.mocked(loadAppData).mockResolvedValue({ projects: [], experts: [] });

    const { result } = renderHook(() => useDataFetch());
    expect(result.current.isRetrying).toBe(true);

    await waitFor(() => expect(result.current.isRetrying).toBe(false));
  });
});
