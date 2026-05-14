import { getSupabaseClient } from '@/lib/supabase';
import type { ProjectData } from '@/types/project';
import type { ExpertData } from '@/types/expert';
import type {
  AppExpertRow,
  AppProjectRow,
  ExpertInsert,
  Json,
  ProjectInsert,
  VolunteerSubscriptionCategoryInsert,
  VolunteerSubscriptionInsert,
} from '@/types/database';
import type { VolunteerSubscriptionData } from '@/types/volunteer';
import { getCategoryLabel, normalizeCategoryId, normalizeCategoryWithFallback } from '@/utils/categories';
import { mockApi } from './mockApi';

const optionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const requiredString = (value: unknown, fieldName: string): string => {
  const normalized = optionalString(value);
  if (!normalized) {
    throw new Error(`Project is missing required ${fieldName}. Every project must reference an existing leading expert.`);
  }
  return normalized;
};

const numericOrDefault = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeYearRange = (row: Pick<AppProjectRow, 'year_range' | 'start_year' | 'end_year'>) => {
  if (row.year_range?.match(/^\d{4}-\d{4}$/)) return row.year_range;
  const start = row.start_year ?? new Date().getFullYear();
  const end = row.end_year ?? start;
  return `${start}-${end}`;
};

const parseYearRange = (yearRange: string | undefined) => {
  const match = yearRange?.match(/^(\d{4})-(\d{4})$/);
  if (!match) return { startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 4 };
  return { startYear: Number(match[1]), endYear: Number(match[2]) };
};

export const toProjectData = (project: AppProjectRow): ProjectData => {
  const categoryId = normalizeCategoryWithFallback(project.category_id, project.field);
  const field = getCategoryLabel(categoryId);
  const description = optionalString(project.description) ?? 'Project description will be added soon.';
  const displayLocation = optionalString(project.display_location) ?? optionalString(project.region_label) ?? optionalString(project.country);
  const contact = optionalString(project.contact);
  const leadExpertId = requiredString(project.lead_expert_id, 'lead_expert_id');
  const leadExpertName = requiredString(project.lead_expert_name, 'lead_expert_name');

  return {
    id: project.id,
    name: project.name,
    status: project.status ?? 'planned',
    categoryId,
    field,
    description,
    location: optionalString(project.location) ?? displayLocation ?? 'Carpathian region',
    displayLocation,
    regionLabel: optionalString(project.region_label) ?? displayLocation,
    yearRange: normalizeYearRange(project),
    lat: numericOrDefault(project.lat, 47.5),
    lng: numericOrDefault(project.lng, 25.0),
    leadExpertId,
    leadExpertName,
    linkedExpertIds: project.linked_expert_ids?.length ? project.linked_expert_ids : [leadExpertId],
    website: optionalString(project.website),
    area: optionalString(project.area),
    country: optionalString(project.country),
    contact,
    cardSummary: optionalString(project.card_summary),
    focusSummary: optionalString(project.focus_summary),
    outputsSummary: optionalString(project.outputs_summary),
    isCitizenScience: project.is_cs === true,
  };
};

export const toExpertData = (expert: AppExpertRow): ExpertData => ({
  id: expert.id,
  name: expert.name,
  institution: expert.institution,
  country: expert.country,
  degree: optionalString(expert.degree),
  headline: optionalString(expert.headline),
  expertiseSubtitle: optionalString(expert.expertise_subtitle),
  bio: optionalString(expert.bio) ?? 'Expert profile details will be added soon.',
  expertise: expert.expertise ?? [],
  publications: expert.publications ?? 0,
  projects: expert.projects ?? 0,
  email: optionalString(expert.email),
  linkedin: optionalString(expert.linkedin),
  scopus: optionalString(expert.scopus),
  orcid: optionalString(expert.orcid),
  googleScholar: optionalString(expert.google_scholar),
  avatarUrl: optionalString(expert.avatar_url),
  isCitizenScience: expert.is_cs === true,
  importMetadata: expert.import_metadata as Record<string, unknown> | undefined,
});

export const apiService = {
  async getProjects(): Promise<ProjectData[]> {
    const { data, error } = await getSupabaseClient()
      .from('app_projects')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(toProjectData);
  },

  async getExperts(): Promise<ExpertData[]> {
    const { data, error } = await getSupabaseClient()
      .from('app_experts')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(toExpertData);
  },

  async addProject(project: Partial<ProjectData>) {
    const categoryId = normalizeCategoryWithFallback(project.categoryId, project.field);
    const { startYear, endYear } = parseYearRange(project.yearRange);
    const leadExpertId = requiredString(project.leadExpertId, 'leadExpertId');
    const insert: ProjectInsert = {
      name: project.name ?? 'Untitled',
      status: project.status ?? 'planned',
      category_id: categoryId,
      description: project.description ?? null,
      location: project.location ?? 'Carpathian region',
      start_year: startYear,
      end_year: endYear,
      region_label: project.regionLabel ?? project.displayLocation ?? null,
      card_summary: project.cardSummary ?? null,
      focus_summary: project.focusSummary ?? null,
      outputs_summary: project.outputsSummary ?? null,
      lead_expert_id: leadExpertId,
      website: project.website ?? null,
      country: project.country ?? null,
      is_cs: project.isCitizenScience ?? true,
    };

    const { data, error } = await getSupabaseClient()
      .from('projects')
      .insert(insert)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addExpert(expert: Partial<ExpertData>) {
    const insert: ExpertInsert = {
      name: expert.name ?? 'Anonymous',
      institution: expert.institution ?? 'Independent',
      country: expert.country ?? 'Unknown',
      degree: expert.degree ?? null,
      headline: expert.headline ?? null,
      expertise_subtitle: expert.expertiseSubtitle ?? null,
      bio: expert.bio ?? null,
      expertise: expert.expertise ?? [],
      publications: expert.publications ?? 0,
      email: expert.email ?? '',
      linkedin: expert.linkedin ?? null,
      scopus: expert.scopus ?? null,
      orcid: expert.orcid ?? null,
      google_scholar: expert.googleScholar ?? null,
      avatar_url: expert.avatarUrl ?? null,
      import_metadata: (expert.importMetadata ?? {}) as Json,
    };

    const { data, error } = await getSupabaseClient()
      .from('experts')
      .insert(insert)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addVolunteerSubscription(subscription: VolunteerSubscriptionData) {
    const consentAt = new Date().toISOString();
    const insert: VolunteerSubscriptionInsert = {
      full_name: subscription.fullName,
      email: subscription.email,
      city: subscription.city,
      country: subscription.country,
      home_location: `SRID=4326;POINT(${subscription.longitude} ${subscription.latitude})`,
      radius_km: subscription.radiusKm,
      note: optionalString(subscription.note) ?? null,
      status: 'active',
      consent_at: consentAt,
    };

    const { data, error } = await getSupabaseClient()
      .from('volunteer_subscriptions')
      .insert(insert)
      .select('id')
      .single();
    if (error) throw error;

    const categoryRows: VolunteerSubscriptionCategoryInsert[] = subscription.categoryIds
      .map((category) => normalizeCategoryId(category))
      .filter((categoryId): categoryId is NonNullable<typeof categoryId> => Boolean(categoryId))
      .map((category_id) => ({ subscription_id: data.id, category_id }));

    if (categoryRows.length === 0) {
      throw new Error('Choose at least one valid category.');
    }

    const { error: categoryError } = await getSupabaseClient()
      .from('volunteer_subscription_categories')
      .insert(categoryRows);
    if (categoryError) throw categoryError;

    return { id: data.id, consentAt };
  },

  async getProjectsMock() { return mockApi.getProjects(); },
  async getExpertsMock() { return mockApi.getExperts(); },
};
