interface ProjectRow {
  id: string;
  name: string;
  status: 'active' | 'past' | 'planned';
  field: string;
  description: string;
  location: string;
  year_range: string;
  lat: number;
  lng: number;
  lead_expert_id: string | null;
  lead_expert_name: string | null;
  website: string | null;
  area: string | null;
  country: string | null;
  is_cs: boolean;
  created_at: string;
}

interface ExpertRow {
  id: string;
  name: string;
  institution: string;
  country: string;
  degree: string;
  bio: string;
  expertise: string[];
  publications: number;
  projects: number;
  email: string | null;
  linkedin: string | null;
  scopus: string | null;
  orcid: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ProjectRow, 'id' | 'created_at'>>;
      };
      experts: {
        Row: ExpertRow;
        Insert: Omit<ExpertRow, 'id' | 'created_at'>;
        Update: Partial<Omit<ExpertRow, 'id' | 'created_at'>>;
      };
    };
  };
};
