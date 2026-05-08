import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '../apiService';
import { mockApi } from '../mockApi';

vi.mock('../mockApi', () => ({
  mockApi: {
    getProjects: vi.fn(),
    getExperts: vi.fn(),
    getProject: vi.fn(),
    getExpert: vi.fn(),
  },
}));

describe('apiService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/v1');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('falls back to mockApi when VITE_API_BASE_URL is empty', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.mocked(mockApi.getProjects).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A test project description here', location: 'Loc', yearRange: '2021-2025', lat: 1, lng: 1 }]);
    const data = await apiService.getProjects();
    expect(data).toHaveLength(1);
    expect(vi.mocked(mockApi.getProjects)).toHaveBeenCalled();
  });

  it('fetches and validates projects from API', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
        status: 'active',
        field: 'Biodiversity',
        description: 'A valid test project description',
        location: 'Romania',
        yearRange: '2021-2025',
        lat: 47.0,
        lng: 25.0,
      }]),
    } as Response);

    const data = await apiService.getProjects();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Test Project');
  });

  it('retries failed network requests up to 3 times', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValueOnce(new Error('Network fail'));
    fetchMock.mockRejectedValueOnce(new Error('Network fail'));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        status: 'active',
        field: 'Bio',
        description: 'A valid test description here',
        location: 'Loc',
        yearRange: '2021-2025',
        lat: 1,
        lng: 1,
      }]),
    } as Response);

    await apiService.getProjects();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws after max retries', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new Error('Persistent fail'));
    await expect(apiService.getProjects()).rejects.toThrow('Persistent fail');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns null for getProject when API fails', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new Error('Not found'));
    const result = await apiService.getProject('123e4567-e89b-12d3-a456-426614174000');
    expect(result).toBeNull();
  });

  it('returns null for getExpert when API fails', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new Error('Not found'));
    const result = await apiService.getExpert('123e4567-e89b-12d3-a456-426614174001');
    expect(result).toBeNull();
  });

  it('throws on HTTP error responses', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response);
    await expect(apiService.getProjects()).rejects.toThrow('HTTP 500');
  });
});
