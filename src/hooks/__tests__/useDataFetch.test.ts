import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDataFetch } from '../useDataFetch';
import { useAppStore } from '@/store/appStore';
import { apiService } from '@/services/apiService';

vi.mock('@/services/apiService', () => ({
  apiService: {
    getProjects: vi.fn(),
    getExperts: vi.fn(),
  },
}));

describe('useDataFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ data: { projects: [], experts: [], loading: false, error: null } });
  });

  it('sets loading true, fetches data, then sets loading false', async () => {
    vi.mocked(apiService.getProjects).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A valid test project description here', location: 'Loc', yearRange: '2021-2025', lat: 1, lng: 1 }]);
    vi.mocked(apiService.getExperts).mockResolvedValue([]);

    renderHook(() => useDataFetch());

    expect(useAppStore.getState().data.loading).toBe(true);

    await waitFor(() => {
      expect(useAppStore.getState().data.loading).toBe(false);
    });

    expect(useAppStore.getState().data.projects).toHaveLength(1);
    expect(useAppStore.getState().data.error).toBeNull();
  });

  it('sets error state on fetch failure', async () => {
    vi.mocked(apiService.getProjects).mockRejectedValue(new Error('Network error'));
    vi.mocked(apiService.getExperts).mockResolvedValue([]);

    renderHook(() => useDataFetch());

    await waitFor(() => {
      expect(useAppStore.getState().data.error).toBe('Network error');
    });
    expect(useAppStore.getState().data.loading).toBe(false);
  });

  it('exposes retry function that re-fetches', async () => {
    vi.mocked(apiService.getProjects).mockRejectedValueOnce(new Error('First fail'));
    vi.mocked(apiService.getExperts).mockResolvedValue([]);

    const { result } = renderHook(() => useDataFetch());
    await waitFor(() => expect(useAppStore.getState().data.error).toBeTruthy());

    vi.mocked(apiService.getProjects).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A valid test project description here', location: 'Loc', yearRange: '2021-2025', lat: 1, lng: 1 }]);
    vi.mocked(apiService.getExperts).mockResolvedValue([]);

    act(() => result.current.retry());

    await waitFor(() => expect(useAppStore.getState().data.error).toBeNull());
    expect(useAppStore.getState().data.projects).toHaveLength(1);
  });

  it('reports isRetrying during fetch', async () => {
    vi.mocked(apiService.getProjects).mockResolvedValue([]);
    vi.mocked(apiService.getExperts).mockResolvedValue([]);

    const { result } = renderHook(() => useDataFetch());
    expect(result.current.isRetrying).toBe(true);

    await waitFor(() => expect(result.current.isRetrying).toBe(false));
  });
});
