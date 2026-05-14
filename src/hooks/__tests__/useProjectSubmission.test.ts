import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectSubmission } from '../useProjectSubmission';

const mockAddProject = vi.fn();
const mockSetStatusMessage = vi.fn();

let mockOnline = true;
let mockExperts: Array<{ id: string; name: string }> = [{ id: 'exp-1', name: 'Dr. Test' }];

vi.mock('@/store/appStore', () => ({
  useAppStore: (sel: any) => {
    const state = {
      isOnline: mockOnline,
      addProject: mockAddProject,
      data: { experts: mockExperts },
    };
    return typeof sel === 'function' ? sel(state) : state;
  },
}));

vi.mock('@/services/apiService', () => ({
  apiService: { addProject: vi.fn() },
}));

describe('useProjectSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnline = true;
    mockExperts = [{ id: 'exp-1', name: 'Dr. Test' }];
  });

  it('submits a project successfully', async () => {
    const { result } = renderHook(() => useProjectSubmission(mockSetStatusMessage));
    const { apiService } = await import('@/services/apiService');
    vi.mocked(apiService.addProject).mockResolvedValue({} as any);

    await act(async () => {
      await result.current.submitProject({
        name: 'Test Project',
        field: 'Biodiversity',
        leadExpertId: 'exp-1',
        location: 'Romania',
        description: 'A valid description for the project submission test.',
      } as any);
    });

    expect(apiService.addProject).toHaveBeenCalled();
    expect(mockAddProject).toHaveBeenCalled();
    expect(mockSetStatusMessage).toHaveBeenCalledWith({ tone: 'success', text: expect.any(String) });
  });

  it('throws when offline', async () => {
    mockOnline = false;

    const { result } = renderHook(() => useProjectSubmission(mockSetStatusMessage));

    await expect(
      act(async () => result.current.submitProject({} as any))
    ).rejects.toThrow('offline');
  });

  it('throws when lead expert not found', async () => {
    const { result } = renderHook(() => useProjectSubmission(mockSetStatusMessage));

    await expect(
      act(async () => result.current.submitProject({
        name: 'Test',
        field: 'Biodiversity',
        leadExpertId: 'nonexistent',
      } as any))
    ).rejects.toThrow('leading expert');
  });
});
