import type { CategoryId } from '@/utils/categories';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Status = 'active' | 'past' | 'planned';
export type ProjectExpertRole = 'lead' | 'contact' | 'contributor';
export type VolunteerStatus = 'active' | 'unsubscribed' | 'pending_review';

export type CategoryRow = {
  id: CategoryId;
  sort_order: number;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type CategoryInsert = Omit<CategoryRow, 'created_at' | 'updated_at'> & {
  created_at?: string | null;
  updated_at?: string | null;
};

export type InstitutionRow = {
  id: string;
  name: string;
  website: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type InstitutionInsert = Omit<InstitutionRow, 'created_at' | 'updated_at'> & {
  created_at?: string | null;
  updated_at?: string | null;
};

export type ExpertRow = {
  id: string;
  name: string;
  institution_id: string;
  country: string;
  degree: string | null;
  headline: string | null;
  expertise_subtitle: string | null;
  bio: string | null;
  expertise: string[] | null;
  publications: number | null;
  email: string;
  linkedin: string | null;
  scopus: string | null;
  orcid: string | null;
  google_scholar: string | null;
  import_metadata: Json;
  created_at: string | null;
  updated_at: string | null;
};

export type ExpertInsert = Omit<ExpertRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProjectRow = {
  id: string;
  name: string;
  status: Status | null;
  category_id: CategoryId;
  description: string | null;
  location: string;
  start_year: number | null;
  end_year: number | null;
  region_label: string | null;
  card_summary: string | null;
  focus_summary: string | null;
  outputs_summary: string | null;
  lead_expert_id: string;
  website: string | null;
  country: string | null;
  is_cs: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProjectInsert = Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProjectLocationRow = {
  id: string;
  project_id: string;
  geom: unknown;
  label: string | null;
  is_primary: boolean;
  created_at: string | null;
};

export type ProjectLocationInsert = Omit<ProjectLocationRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string | null;
};

export type ProjectExpertRow = {
  project_id: string;
  expert_id: string;
  role: ProjectExpertRole;
  created_at: string | null;
};

export type ProjectExpertInsert = Omit<ProjectExpertRow, 'created_at'> & {
  created_at?: string | null;
};

export type VolunteerSubscriptionRow = {
  id: string;
  full_name: string;
  email: string;
  city: string;
  country: string;
  home_location: unknown;
  radius_km: number;
  note: string | null;
  status: VolunteerStatus;
  consent_at: string;
  created_at: string | null;
  updated_at: string | null;
};

export type VolunteerSubscriptionInsert = Omit<VolunteerSubscriptionRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type VolunteerSubscriptionCategoryRow = {
  subscription_id: string;
  category_id: CategoryId;
};

export type VolunteerSubscriptionCategoryInsert = VolunteerSubscriptionCategoryRow;

export type AppProjectRow = {
  id: string;
  name: string;
  status: Status | null;
  category_id: string | null;
  field: string | null;
  description: string | null;
  location: string | null;
  display_location: string | null;
  region_label: string | null;
  year_range: string | null;
  start_year: number | null;
  end_year: number | null;
  lat: number | string | null;
  lng: number | string | null;
  lead_expert_id: string;
  lead_expert_name: string;
  linked_expert_ids: string[] | null;
  website: string | null;
  area: string | null;
  country: string | null;
  contact: string | null;
  card_summary: string | null;
  focus_summary: string | null;
  outputs_summary: string | null;
  is_cs: boolean | null;
};

export type AppExpertRow = ExpertRow & {
  institution: string;
  institution_website: string | null;
  projects: number | null;
  is_cs: boolean | null;
  import_metadata: Json;
};

export type VolunteerProjectMatchRow = {
  subscription_id: string;
  full_name: string;
  email: string;
  city: string;
  country: string;
  radius_km: number;
  distance_km: number;
  matched_category: CategoryId;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: Partial<CategoryInsert>;
        Relationships: [];
      };
      experts: {
        Row: ExpertRow;
        Insert: ExpertInsert;
        Update: Partial<ExpertInsert>;
        Relationships: [];
      };
      institutions: {
        Row: InstitutionRow;
        Insert: InstitutionInsert;
        Update: Partial<InstitutionInsert>;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: Partial<ProjectInsert>;
        Relationships: [];
      };
      project_locations: {
        Row: ProjectLocationRow;
        Insert: ProjectLocationInsert;
        Update: Partial<ProjectLocationInsert>;
        Relationships: [];
      };
      project_experts: {
        Row: ProjectExpertRow;
        Insert: ProjectExpertInsert;
        Update: Partial<ProjectExpertInsert>;
        Relationships: [];
      };
      volunteer_subscriptions: {
        Row: VolunteerSubscriptionRow;
        Insert: VolunteerSubscriptionInsert;
        Update: Partial<VolunteerSubscriptionInsert>;
        Relationships: [];
      };
      volunteer_subscription_categories: {
        Row: VolunteerSubscriptionCategoryRow;
        Insert: VolunteerSubscriptionCategoryInsert;
        Update: Partial<VolunteerSubscriptionCategoryInsert>;
        Relationships: [];
      };
    };
    Views: {
      app_projects: {
        Row: AppProjectRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      app_experts: {
        Row: AppExpertRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      find_volunteers_for_project: {
        Args: { project_id: string };
        Returns: VolunteerProjectMatchRow[];
      };
    };
  };
};
