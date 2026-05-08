// src/store/appStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProjectData } from '@/types/project';
import { ExpertData } from '@/types/expert';

export type SortKey = 'name' | 'status' | 'field' | 'yearRange';
export type SortDirection = 'asc' | 'desc';

export type FilterState = {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'past' | 'planned';
  fieldFilter: string;
  areaFilter: string;
  activeTab: 'projects' | 'experts';
  sortKey: SortKey;
  sortDirection: SortDirection;
};

export type A11yState = {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
};

export type AppState = {
  filters: FilterState;
  ui: { isMapVisible: boolean; selectedExpertId: string | null; selectedProjectId: string | null; hoveredProjectId: string | null };
  data: { projects: ProjectData[]; experts: ExpertData[]; loading: boolean; error: string | null };
  a11y: A11yState;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: FilterState['statusFilter']) => void;
  setFieldFilter: (field: string) => void;
  setAreaFilter: (area: string) => void;
  setActiveTab: (tab: FilterState['activeTab']) => void;
  setSortKey: (key: SortKey) => void;
  setSortDirection: (direction: SortDirection) => void;
  clearFilters: () => void;
  toggleMap: () => void;
  setSelectedExpertId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setHoveredProjectId: (id: string | null) => void;
  setProjects: (projects: ProjectData[]) => void;
  setExperts: (experts: ExpertData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setA11y: (updates: Partial<A11yState>) => void;
  addProject: (project: Partial<ProjectData>) => void;
  addExpert: (expert: Partial<ExpertData>) => void;
  draftPolygon: [number, number][] | null;
  setDraftPolygon: (coords: [number, number][] | null) => void;
};

const initialFilters: FilterState = {
  searchTerm: '', statusFilter: 'all', fieldFilter: 'all', areaFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc'
};

export const useAppStore = create<AppState>()(
  immer((set) => ({
    filters: { ...initialFilters },
    ui: { isMapVisible: true, selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null },
    data: { projects: [], experts: [], loading: false, error: null },
    draftPolygon: null,
    a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    setSearchTerm: (term) => set((s) => { s.filters.searchTerm = term; }),
    setStatusFilter: (status) => set((s) => { s.filters.statusFilter = status; }),
    setFieldFilter: (field) => set((s) => { s.filters.fieldFilter = field; }),
    setAreaFilter: (area) => set((s) => { s.filters.areaFilter = area; }),
    setActiveTab: (tab) => set((s) => { s.filters.activeTab = tab; }),
    setSortKey: (key) => set((s) => { s.filters.sortKey = key; }),
    setSortDirection: (direction) => set((s) => { s.filters.sortDirection = direction; }),
    clearFilters: () => set((s) => { s.filters = { ...initialFilters }; }),
    toggleMap: () => set((s) => { s.ui.isMapVisible = !s.ui.isMapVisible; }),
    setSelectedExpertId: (id) => set((s) => { s.ui.selectedExpertId = id; }),
    setSelectedProjectId: (id) => set((s) => { s.ui.selectedProjectId = id; }),
    setHoveredProjectId: (id) => set((s) => { s.ui.hoveredProjectId = id; }),
    setProjects: (projects) => set((s) => { s.data.projects = projects; }),
    setExperts: (experts) => set((s) => { s.data.experts = experts; }),
    setLoading: (loading) => set((s) => { s.data.loading = loading; }),
    setError: (error) => set((s) => { s.data.error = error; }),
    setA11y: (updates) => set((s) => { Object.assign(s.a11y, updates); }),
    addProject: (project) => set((s) => {
      const complete = {
        id: project.id || crypto.randomUUID(),
        name: project.name || 'Untitled',
        status: project.status || 'planned',
        field: project.field || 'General',
        description: project.description || '',
        location: project.location || 'Unknown',
        yearRange: project.yearRange || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
        lat: project.lat || 47.5,
        lng: project.lng || 25.0,
        ...project,
      } as ProjectData;
      s.data.projects.push(complete);
    }),
    addExpert: (expert) => set((s) => {
      const complete = {
        id: expert.id || crypto.randomUUID(),
        name: expert.name || 'Anonymous',
        institution: expert.institution || 'Independent',
        country: expert.country || 'Unknown',
        degree: expert.degree || 'Volunteer',
        bio: expert.bio || '',
        expertise: expert.expertise || [],
        publications: expert.publications ?? 0,
        projects: expert.projects ?? 0,
        ...expert,
      } as ExpertData;
      s.data.experts.push(complete);
    }),
    setDraftPolygon: (coords) => set((s) => { s.draftPolygon = coords; }),
  }))
);