import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../apiService';
import { mockApi } from '../mockApi';
import { ProjectSchema } from '@/types/project';
import { ExpertSchema } from '@/types/expert';

vi.mock('../mockApi');

describe('apiService - Mock Fallback', () => {
  const mockProject = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    status: 'active' as const,
    field: 'Biodiversity',
    description: 'A valid test description with enough characters',
    location: 'Test Location',
    yearRange: '2024-2028',
    lat: 47.5,
    lng: 25.0,
    isCitizenScience: true,
  };

  const mockExpert = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Expert',
    institution: 'University',
    country: 'Romania',
    degree: 'PhD',
    bio: 'A valid expert bio with enough characters to pass validation.',
    expertise: ['Ecology'],
    email: 'expert@example.com',
    linkedin: 'https://linkedin.com/in/expert',
    isCitizenScience: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns projects via getProjectsMock', async () => {
    vi.mocked(mockApi.getProjects).mockResolvedValue([mockProject]);

    const result = await apiService.getProjectsMock();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockProject.id);
    expect(mockApi.getProjects).toHaveBeenCalledTimes(1);
  });

  it('validates mock project data against Zod schema', async () => {
    vi.mocked(mockApi.getProjects).mockResolvedValue([mockProject]);

    const result = await apiService.getProjectsMock();
    expect(ProjectSchema.safeParse(result[0]).success).toBe(true);
  });

  it('rejects projects with invalid coordinates', async () => {
    const invalid = { ...mockProject, lat: 100, lng: 200 };
    vi.mocked(mockApi.getProjects).mockResolvedValue([invalid]);

    const result = await apiService.getProjectsMock();
    expect(ProjectSchema.safeParse(result[0]).success).toBe(false);
  });

  it('returns experts via getExpertsMock', async () => {
    vi.mocked(mockApi.getExperts).mockResolvedValue([mockExpert]);

    const result = await apiService.getExpertsMock();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockExpert.id);
    expect(mockApi.getExperts).toHaveBeenCalledTimes(1);
  });

  it('validates mock expert data against Zod schema', async () => {
    vi.mocked(mockApi.getExperts).mockResolvedValue([mockExpert]);

    const result = await apiService.getExpertsMock();
    expect(ExpertSchema.safeParse(result[0]).success).toBe(true);
  });
});
