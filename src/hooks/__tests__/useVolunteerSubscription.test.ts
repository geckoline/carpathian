import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVolunteerSubscription } from '../useVolunteerSubscription';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);
const mockAddVolunteerSubscription = vi.fn();
vi.mock('@/services/apiService', () => ({
  apiService: { addVolunteerSubscription: (...args: any[]) => mockAddVolunteerSubscription(...args) },
}));

const mockSetStatusMessage = vi.fn();
const ONLINE_STATE = { isOnline: true };

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel?: any) => createMockAppStore({ isOnline: ONLINE_STATE.isOnline }).useAppStore(sel)),
}));

describe('useVolunteerSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ONLINE_STATE.isOnline = true;
  });

  it('calls apiService and sets success message on submit', async () => {
    mockAddVolunteerSubscription.mockResolvedValueOnce({ id: 'sub-1', consentAt: new Date().toISOString() });
    const { result } = renderHook(() => useVolunteerSubscription(mockSetStatusMessage));

    await act(async () => {
      await result.current.submitVolunteerSubscription({
        fullName: 'Test', email: 'a@b.com', city: 'City', country: 'CO',
        latitude: 45, longitude: 25, radiusKm: 50, categoryIds: ['biodiversity'], consent: true, note: '',
      });
    });

    expect(mockAddVolunteerSubscription).toHaveBeenCalled();
    expect(mockSetStatusMessage).toHaveBeenCalledWith(expect.objectContaining({ tone: 'success' }));
  });

  it('sets error message when apiService throws', async () => {
    mockAddVolunteerSubscription.mockRejectedValueOnce(new Error('API Error'));
    const { result } = renderHook(() => useVolunteerSubscription(mockSetStatusMessage));

    await act(async () => {
      try {
        await result.current.submitVolunteerSubscription({
          fullName: 'Test', email: 'a@b.com', city: 'City', country: 'CO',
          latitude: 45, longitude: 25, radiusKm: 50, categoryIds: ['biodiversity'], consent: true, note: '',
        });
      } catch { /* expected */ }
    });

    expect(mockSetStatusMessage).toHaveBeenCalledWith(expect.objectContaining({ tone: 'error' }));
  });

  it('throws when offline', async () => {
    ONLINE_STATE.isOnline = false;
    const { result } = renderHook(() => useVolunteerSubscription(mockSetStatusMessage));

    await expect(async () => {
      await act(async () => {
        await result.current.submitVolunteerSubscription({
          fullName: 'Test', email: 'a@b.com', city: 'City', country: 'CO',
          latitude: 45, longitude: 25, radiusKm: 50, categoryIds: ['biodiversity'], consent: true, note: '',
        });
      });
    }).rejects.toThrow(/offline/i);
  });
});
