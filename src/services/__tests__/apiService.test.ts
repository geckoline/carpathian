import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('apiService mock fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns projects from mockApi via getProjectsMock', async () => {
    vi.mocked(mockApi.getProjects).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A test project description here', location: 'Loc', yearRange: '2021-2025', lat: 1, lng: 1 }]);
    const data = await apiService.getProjectsMock();
    expect(data).toHaveLength(1);
    expect(vi.mocked(mockApi.getProjects)).toHaveBeenCalled();
  });

  it('returns experts from mockApi via getExpertsMock', async () => {
    vi.mocked(mockApi.getExperts).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'Expert', institution: 'Inst', country: 'CO', degree: 'PhD', bio: 'Valid bio with enough chars for validation test.', expertise: ['Ecology'], email: 'a@b.com', linkedin: 'https://linkedin.com/in/a' }]);
    const data = await apiService.getExpertsMock();
    expect(data).toHaveLength(1);
    expect(vi.mocked(mockApi.getExperts)).toHaveBeenCalled();
  });
});
