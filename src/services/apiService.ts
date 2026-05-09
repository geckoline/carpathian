import { supabase } from '@/lib/supabase';
import type { ProjectData } from '@/types/project';
import type { ExpertData } from '@/types/expert';
import { mockApi } from './mockApi';

export const apiService = {
  async getProjects(): Promise<ProjectData[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      yearRange: p.year_range,
      leadExpertId: p.lead_expert_id,
      leadExpertName: p.lead_expert_name,
      isCitizenScience: p.is_cs ?? true,
    })) as any;
  },

  async getExperts(): Promise<ExpertData[]> {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map((e: any) => ({
      ...e,
      avatarUrl: e.avatar_url,
      isCitizenScience: e.is_cs ?? true,
    })) as any;
  },

  async addProject(project: Partial<ProjectData>) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        status: project.status,
        field: project.field,
        description: project.description,
        location: project.location,
        year_range: project.yearRange,
        lat: project.lat,
        lng: project.lng,
        is_cs: project.isCitizenScience ?? true,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addExpert(expert: Partial<ExpertData>) {
    const { data, error } = await supabase
      .from('experts')
      .insert({
        name: expert.name,
        institution: expert.institution,
        country: expert.country,
        degree: expert.degree,
        bio: expert.bio,
        expertise: expert.expertise,
        email: expert.email,
        linkedin: expert.linkedin,
        scopus: expert.scopus,
        orcid: expert.orcid,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getProjectsMock() { return mockApi.getProjects(); },
  async getExpertsMock() { return mockApi.getExperts(); },
};
