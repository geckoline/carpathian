import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDataFetch } from '../useDataFetch';
import { useAppStore } from '@/store/appStore';

const mockGetProjects = vi.hoisted(() => vi.fn());
const mockGetExperts = vi.hoisted(() => vi.fn());

vi.mock('@/services/apiService', () => ({
  apiService: {
    getProjects: mockGetProjects,
    getExperts: mockGetExperts,
    getProjectsMock: vi.fn(),
    getExpertsMock: vi.fn(),
    addProject: vi.fn(),
    addExpert: vi.fn(),
  },
}));

describe('useDataFetch - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      data: { projects: [], experts: [], loading: false, error: null },
    });
  });

  it('loads data successfully and updates store', async () => {
    const mockProjects = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A valid test project description for testing', location: 'Loc', yearRange: '2024-2028', lat: 1, lng: 1, isCitizenScience: true }];
    const mockExperts = [{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'Expert', institution: 'Inst', country: 'Country', degree: 'PhD', bio: 'A valid expert bio with enough characters to pass validation.', expertise: ['Skill'], email: 'expert@example.com', linkedin: 'https://linkedin.com/in/expert' }];

    mockGetProjects.mockResolvedValue(mockProjects);
    mockGetExperts.mockResolvedValue(mockExperts);

    const { result } = renderHook(() => useDataFetch());

    expect(useAppStore.getState().data.loading).toBe(true);
    expect(result.current.isRetrying).toBe(true);

    await waitFor(() => {
      expect(useAppStore.getState().data.loading).toBe(false);
    });

    const state = useAppStore.getState();
    expect(state.data.projects).toHaveLength(1);
    expect(state.data.experts).toHaveLength(1);
    expect(state.data.error).toBeNull();
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retry).toBeDefined();
  });

  it('handles API errors and exposes retry function', async () => {
    mockGetProjects.mockRejectedValue(new Error('API down'));
    mockGetExperts.mockResolvedValue([]);

    const { result } = renderHook(() => useDataFetch());

    await waitFor(() => {
      expect(useAppStore.getState().data.error).toBe('API down');
    });

    mockGetProjects.mockResolvedValueOnce([]);
    act(() => result.current.retry());

    await waitFor(() => {
      expect(mockGetProjects).toHaveBeenCalledTimes(2);
    });
  });

  it('prevents concurrent fetches during loading', async () => {
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => { resolvePromise = resolve; });
    mockGetProjects.mockReturnValue(delayedPromise);
    mockGetExperts.mockResolvedValue([]);

    renderHook(() => useDataFetch());

    act(() => {
      resolvePromise!([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A valid test project description for testing', location: 'Loc', yearRange: '2024-2028', lat: 1, lng: 1, isCitizenScience: true }]);
    });

    await waitFor(() => {
      expect(mockGetProjects).toHaveBeenCalledTimes(1);
    });
  });

  it('validates fetched data before storing', async () => {
    const invalidProject = { id: 'bad', name: '' };
    mockGetProjects.mockResolvedValue([invalidProject]);
    mockGetExperts.mockResolvedValue([]);

    renderHook(() => useDataFetch());

    await waitFor(() => {
      expect(useAppStore.getState().data.error).toBeTruthy();
    });
    expect(useAppStore.getState().data.projects).toHaveLength(0);
  });
});
