import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProjectData } from '@/types/project';
import type { ExpertData } from '@/types/expert';

export type DatasetMode = 'cs' | 'all';
export type ThemeMode = 'light' | 'dark' | 'reduced';
export type SortKey = 'name' | 'status' | 'field' | 'yearRange';
export type SortDirection = 'asc' | 'desc';

export type FilterState = {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'past' | 'planned';
  fieldFilter: string;
  countryFilter: string;
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
  dataset: DatasetMode;
  theme: ThemeMode;
  isOnline: boolean;
  filters: FilterState;
  ui: { isMapVisible: boolean; selectedExpertId: string | null; selectedProjectId: string | null; hoveredProjectId: string | null };
  data: { projects: ProjectData[]; experts: ExpertData[]; loading: boolean; error: string | null };
  a11y: A11yState;
  draftPolygon: [number, number][] | null;
  
  setDataset: (mode: DatasetMode) => void;
  setTheme: (mode: ThemeMode) => void;
  setOnlineStatus: (status: boolean) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: FilterState['statusFilter']) => void;
  setFieldFilter: (field: string) => void;
  setCountryFilter: (country: string) => void;
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
  setDraftPolygon: (coords: [number, number][] | null) => void;
};

const initialFilters: FilterState = {
  searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc'
};

export const useAppStore = create<AppState>()(
  immer((set) => ({
    dataset: 'cs',
    theme: 'light',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    filters: { ...initialFilters },
    ui: { isMapVisible: true, selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null },
    data: { projects: [], experts: [], loading: false, error: null },
    draftPolygon: null,
    a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    
    setDataset: (mode) => set((s) => { s.dataset = mode; }),
    setTheme: (mode) => set((s) => { s.theme = mode; }),
    setOnlineStatus: (status) => set((s) => { s.isOnline = status; }),
    setSearchTerm: (term) => set((s) => { s.filters.searchTerm = term; }),
    setStatusFilter: (status) => set((s) => { s.filters.statusFilter = status; }),
    setFieldFilter: (field) => set((s) => { s.filters.fieldFilter = field; }),
    setCountryFilter: (country) => set((s) => { s.filters.countryFilter = country; }),
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
        isCitizenScience: project.isCitizenScience ?? true,
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
