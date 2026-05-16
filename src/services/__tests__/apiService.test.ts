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
    vi.mocked(mockApi.getProjects).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', status: 'active', field: 'Bio', description: 'A test project description here', location: 'Loc', yearRange: '2021-2025', expertIds: ['123e4567-e89b-12d3-a456-426614174001'], teamMembers: [{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'Test Expert' }], lat: 1, lng: 1, countries: ['RO'] }]);
    const data = await apiService.getProjectsMock();
    expect(data).toHaveLength(1);
    expect(vi.mocked(mockApi.getProjects)).toHaveBeenCalled();
  });

  it('returns experts from mockApi via getExpertsMock', async () => {
    vi.mocked(mockApi.getExperts).mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174001', name: 'Expert', institution: 'Inst', countries: ['RO'], bio: 'Valid bio with enough chars for validation test.', expertise: ['Ecology'], email: 'a@b.com', linkedin: 'https://linkedin.com/in/a' }]);
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
          countries: ['RO'],
          contact: null,
          is_cs: true,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [project] = await apiService.getProjects();

    expect(mockSupabaseFrom).toHaveBeenCalledWith('app_projects');
    expect(project!.countries).toEqual(['RO']);
    expect(project!.website).toBeUndefined();
    expect(project!.categoryId).toBe('biodiversity');
    expect(ProjectSchema.safeParse(project).success).toBe(true);
  });

  it('normalizes legacy app_projects country and linked expert columns', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Legacy View Project',
          status: 'active',
          category_id: 'biodiversity',
          field: 'Biodiversity',
          description: 'A valid project from the legacy app_projects view.',
          location: 'Romania',
          display_location: 'Romania',
          region_label: null,
          year_range: '2024-2028',
          start_year: 2024,
          end_year: 2028,
          lat: 47.5,
          lng: 25,
          country: 'Romania/Poland',
          linked_expert_ids: [
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174002',
          ],
          contact: null,
          is_cs: false,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [project] = await apiService.getProjects();

    expect(project!.countries).toEqual(['RO', 'PL']);
    expect(project!.expertIds).toEqual([
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ]);
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
          countries: ['RO'],
          contact: null,
          is_cs: null,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [project] = await apiService.getProjects();

    expect(project!.isCitizenScience).toBe(false);
  });

  it('normalizes nullable Supabase expert fields before validation', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Supabase Expert',
          institution_id: 'inst',
          institution: 'Inst',
          institution_website: null,
          countries: ['RO'],
          bio: 'A valid expert biography for service mapping.',
          expertise: ['Ecology'],
          publications: null,
          projects: null,
          email: 'expert@example.com',
          linkedin: null,
          scopus: 'https://scopus.com/authid/example',
          orcid: null,
          google_scholar: null,
          avatar_url: 'https://example.com/avatar.jpg',
          is_cs: true,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [expert] = await apiService.getExperts();

    expect(mockSupabaseFrom).toHaveBeenCalledWith('app_experts');
    expect(expert!.linkedin).toBeUndefined();
    expect(expert!.publications).toBe(0);
    expect(expert!.institutionId).toBe('inst');
    expect(expert!.institutionWebsite).toBeUndefined();
    expect(expert!.profileImageUrl).toBeUndefined();
    expect(ExpertSchema.safeParse(expert).success).toBe(true);
  });

  it('normalizes legacy app_experts country column', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Legacy Expert',
          institution: 'Inst',
          country: 'Romania',
          bio: 'A valid expert biography from the legacy app_experts view.',
          expertise: ['Ecology'],
          publications: 12,
          projects: 3,
          email: 'legacy@example.com',
          linkedin: null,
          scopus: null,
          orcid: null,
          google_scholar: null,
          is_cs: true,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [expert] = await apiService.getExperts();

    expect(expert!.countries).toEqual(['RO']);
    expect(expert!.institutionId).toBeUndefined();
    expect(ExpertSchema.safeParse(expert).success).toBe(true);
  });

  it('upserts an institution before inserting an expert', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'expert-1' }, error: null }),
      }),
    });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'institutions') return { upsert };
      if (table === 'experts') return { insert };
      throw new Error(`Unexpected table ${table}`);
    });

    await apiService.addExpert({
      name: 'New Expert',
      institution: 'University of Bucharest',
      countries: ['RO'],
      bio: 'A valid expert biography for insertion.',
      expertise: ['Ecology'],
      email: 'new@example.com',
    });

    expect(upsert).toHaveBeenCalledWith({
      id: 'university-of-bucharest',
      name: 'University of Bucharest',
      website: null,
    }, { onConflict: 'id' });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      institution_id: 'university-of-bucharest',
    }));
  });

  it('inserts projects with expert references', async () => {
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
      description: 'A valid project with expert references.',
      location: 'Romania',
      yearRange: '2024-2028',
      expertIds: ['123e4567-e89b-12d3-a456-426614174001'],
    });

    expect(mockSupabaseFrom).toHaveBeenCalledWith('projects');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      category_id: 'water',
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
      radiusKm: 75,
      categoryIds: ['Biodiversity', 'Wather'],
      note: 'Weekend fieldwork',
      consent: true,
    });

    expect(result.id).toBe('sub-1');
    expect(subscriptionInsert).toHaveBeenCalledWith(expect.objectContaining({
      full_name: 'Test User',
      home_location: null,
      radius_km: 75,
      status: 'active',
    }));
    expect(categoryInsert).toHaveBeenCalledWith([
      { subscription_id: 'sub-1', category_id: 'biodiversity' },
      { subscription_id: 'sub-1', category_id: 'water' },
    ]);
  });

  it('handles null project fields with fallback values', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'proj-null',
          name: 'Null Fields Project',
          status: null,
          category_id: null,
          field: 'Biodiversity',
          description: null,
          location: null,
          display_location: null,
          region_label: null,
          year_range: null,
          start_year: null,
          end_year: null,
          lat: null,
          lng: null,
          expert_ids: [],
          countries: [],
          website: null,
          area: null,
          contact: null,
          is_cs: null,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [project] = await apiService.getProjects();

    expect(project!.status).toBe('planned');
    expect(project!.description).toBe('Project description will be added soon.');
    expect(project!.location).toBe('Carpathian region');
    expect(project!.lat).toBe(47.5);
    expect(project!.lng).toBe(25.0);
    expect(project!.yearRange).toBe(`${new Date().getFullYear()}-${new Date().getFullYear()}`);
    expect(project!.isCitizenScience).toBe(false);
  });

  it('throws error on volunteer subscription with no valid categories', async () => {
    const subscriptionInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'sub-1' }, error: null }),
      }),
    });
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'volunteer_subscriptions') return { insert: subscriptionInsert };
      throw new Error(`Unexpected table ${table}`);
    });

    await expect(apiService.addVolunteerSubscription({
      fullName: 'Test', email: 'a@b.com', city: 'City', country: 'CO',
      radiusKm: 50,
      categoryIds: ['nonexistent-category'],
      consent: true,
    })).rejects.toThrow(/at least one valid category/i);
  });

  it('parses year range from start_year and end_year when year_range is missing', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{
          id: 'proj-1',
          name: 'Test',
          status: 'active',
          category_id: 'biodiversity',
          field: 'Biodiversity',
          description: 'A valid description.',
          location: 'Loc',
          display_location: 'Loc',
          region_label: null,
          year_range: null,
          start_year: 2020,
          end_year: 2025,
          lat: 47.5,
          lng: 25,
          expert_ids: ['expert-1'],
          countries: ['RO'],
          website: null,
          area: null,
          contact: null,
          is_cs: true,
        }],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(query);

    const [project] = await apiService.getProjects();
    expect(project!.yearRange).toBe('2020-2025');
  });
});
