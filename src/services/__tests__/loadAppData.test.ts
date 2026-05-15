import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAppData } from '../loadAppData';
import { apiService } from '../apiService';
import { mockApi } from '../mockApi';

vi.mock('../apiService', () => ({
  apiService: {
    getProjects: vi.fn(),
    getExperts: vi.fn(),
  },
}));

vi.mock('../mockApi', () => ({
  mockApi: {
    getProjects: vi.fn(),
    getExperts: vi.fn(),
  },
}));

const project = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Forest Watch',
  status: 'active' as const,
  field: 'Biodiversity',
  description: 'A valid test project description.',
  location: 'Romania',
  yearRange: '2024-2028',
  leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
  leadExpertName: 'Dr. Test Expert',
  lat: 47.5,
  lng: 25,
  isCitizenScience: true,
};

const expert = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Dr. Test Expert',
  institution: 'Carpathian Institute',
  country: 'Romania',
  degree: 'PhD',
  bio: 'A valid expert biography for data loading tests.',
  expertise: ['Ecology'],
  email: 'expert@example.com',
  linkedin: 'https://linkedin.com/in/expert',
  isCitizenScience: true,
};

describe('loadAppData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and validates API projects and experts when available', async () => {
    vi.mocked(apiService.getProjects).mockResolvedValue([project]);
    vi.mocked(apiService.getExperts).mockResolvedValue([expert]);

    const result = await loadAppData();

    expect(result.projects).toEqual([project]);
    expect(result.experts).toEqual([expert]);
    expect(mockApi.getProjects).not.toHaveBeenCalled();
    expect(mockApi.getExperts).not.toHaveBeenCalled();
  });

  it('falls back to mock data when the API rejects', async () => {
    vi.mocked(apiService.getProjects).mockRejectedValue(new Error('No Supabase'));
    vi.mocked(apiService.getExperts).mockRejectedValue(new Error('No Supabase'));
    vi.mocked(mockApi.getProjects).mockResolvedValue([project]);
    vi.mocked(mockApi.getExperts).mockResolvedValue([expert]);

    const result = await loadAppData();

    expect(result.projects).toEqual([project]);
    expect(result.experts).toEqual([expert]);
  });

  it('falls back to mock data when the API returns empty collections', async () => {
    vi.mocked(apiService.getProjects).mockResolvedValue([]);
    vi.mocked(apiService.getExperts).mockResolvedValue([]);
    vi.mocked(mockApi.getProjects).mockResolvedValue([project]);
    vi.mocked(mockApi.getExperts).mockResolvedValue([expert]);

    const result = await loadAppData();

    expect(result.projects).toEqual([project]);
    expect(result.experts).toEqual([expert]);
  });

  it('skips invalid items and loads valid ones gracefully', async () => {
    vi.mocked(apiService.getProjects).mockResolvedValue([
      { id: 'bad', name: '' } as any,
      project,
    ]);
    vi.mocked(apiService.getExperts).mockResolvedValue([expert]);

    const result = await loadAppData();

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]!.id).toBe(project.id);
    expect(result.experts).toHaveLength(1);
  });

  it('returns empty arrays when all items are invalid', async () => {
    vi.mocked(apiService.getProjects).mockResolvedValue([{ id: 'bad', name: '' } as any]);
    vi.mocked(apiService.getExperts).mockResolvedValue([{} as any]);

    const result = await loadAppData();

    expect(result.projects).toHaveLength(0);
    expect(result.experts).toHaveLength(0);
  });
});
