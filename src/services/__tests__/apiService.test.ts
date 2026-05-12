import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../apiService';
import { mockApi } from '../mockApi';
import { ProjectSchema } from '@/types/project';
import { ExpertSchema } from '@/types/expert';

const mockSupabaseFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

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
    vi.mocked(mockApi.getProjects).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A test project description here', location: 'Loc', yearRange: '2021-2025', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Test Expert', lat: 1, lng: 1 }]);
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

  it('normalizes nullable Supabase project fields before validation', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Supabase Project',
          status: 'active',
          category_id: 'biodiversity',
          field: 'Biodiversity',
          description: 'A valid test project description.',
          location: 'Romania',
          display_location: 'Romania',
          region_label: null,
          year_range: '2024-2028',
          start_year: 2024,
          end_year: 2028,
          lat: 47.5,
          lng: 25,
          lead_expert_id: '123e4567-e89b-12d3-a456-426614174001',
          lead_expert_name: 'Dr. Elena Popescu',
          linked_expert_ids: [
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174004',
          ],
          website: null,
          area: null,
          country: 'Romania',
          contact: null,
          is_cs: true,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [project] = await apiService.getProjects();

    expect(mockSupabaseFrom).toHaveBeenCalledWith('app_projects');
    expect(project.leadExpertId).toBe('123e4567-e89b-12d3-a456-426614174001');
    expect(project.leadExpertName).toBe('Dr. Elena Popescu');
    expect(project.linkedExpertIds).toEqual([
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174004',
    ]);
    expect(project.website).toBeUndefined();
    expect(project.categoryId).toBe('biodiversity');
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });

  it('treats only explicit Supabase is_cs=true projects as citizen science', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Non CS Project',
          status: 'active',
          category_id: 'water',
          field: 'Water',
          description: 'A valid project description.',
          location: 'Romania',
          display_location: 'Romania',
          region_label: null,
          year_range: '2024-2028',
          start_year: 2024,
          end_year: 2028,
          lat: 47.5,
          lng: 25,
          lead_expert_id: '123e4567-e89b-12d3-a456-426614174001',
          lead_expert_name: 'Dr. Elena Popescu',
          linked_expert_ids: null,
          website: null,
          area: null,
          country: 'Romania',
          contact: null,
          is_cs: null,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [project] = await apiService.getProjects();

    expect(project.isCitizenScience).toBe(false);
    expect(project.linkedExpertIds).toEqual(['123e4567-e89b-12d3-a456-426614174001']);
  });

  it('normalizes nullable Supabase expert fields before validation', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Supabase Expert',
          institution: 'Inst',
          country: 'Romania',
          degree: 'PhD',
          bio: 'A valid expert biography for service mapping.',
          expertise: ['Ecology'],
          publications: null,
          projects: null,
          email: 'expert@example.com',
          linkedin: null,
          scopus: 'https://scopus.com/authid/example',
          orcid: null,
          google_scholar: null,
          avatar_url: null,
          is_cs: true,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [expert] = await apiService.getExperts();

    expect(mockSupabaseFrom).toHaveBeenCalledWith('app_experts');
    expect(expert.linkedin).toBeUndefined();
    expect(expert.publications).toBe(0);
    expect(ExpertSchema.safeParse(expert).success).toBe(true);
  });

  it('requires a leading expert before inserting a project', async () => {
    await expect(apiService.addProject({
      name: 'Orphan Project',
      status: 'planned',
      field: 'Biodiversity',
      description: 'A project without a database expert should be rejected.',
      location: 'Romania',
      yearRange: '2024-2028',
    })).rejects.toThrow(/leading expert/i);
  });

  it('inserts projects with a required leading expert reference', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'project-1' }, error: null }),
      }),
    });
    mockSupabaseFrom.mockReturnValue({ insert });

    await apiService.addProject({
      name: 'Led Project',
      status: 'planned',
      field: 'Water',
      description: 'A valid project with a real leading expert.',
      location: 'Romania',
      yearRange: '2024-2028',
      leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
      leadExpertName: 'Dr. Elena Popescu',
    });

    expect(mockSupabaseFrom).toHaveBeenCalledWith('projects');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      category_id: 'water',
      lead_expert_id: '123e4567-e89b-12d3-a456-426614174001',
    }));
  });

  it('inserts global volunteer subscriptions with location, consent, and category rows', async () => {
    const subscriptionInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'sub-1' }, error: null }),
      }),
    });
    const categoryInsert = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'volunteer_subscriptions') return { insert: subscriptionInsert };
      if (table === 'volunteer_subscription_categories') return { insert: categoryInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await apiService.addVolunteerSubscription({
      fullName: 'Test User',
      email: 'test@example.com',
      city: 'Brasov',
      country: 'Romania',
      latitude: 45.6427,
      longitude: 25.5887,
      radiusKm: 75,
      categoryIds: ['Biodiversity', 'Wather'],
      note: 'Weekend fieldwork',
      consent: true,
    });

    expect(result.id).toBe('sub-1');
    expect(subscriptionInsert).toHaveBeenCalledWith(expect.objectContaining({
      full_name: 'Test User',
      home_location: 'SRID=4326;POINT(25.5887 45.6427)',
      radius_km: 75,
      status: 'active',
    }));
    expect(categoryInsert).toHaveBeenCalledWith([
      { subscription_id: 'sub-1', category_id: 'biodiversity' },
      { subscription_id: 'sub-1', category_id: 'water' },
    ]);
  });
});
