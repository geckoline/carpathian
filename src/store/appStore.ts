import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ProjectData } from '@/types/project';
import type { ExpertData } from '@/types/expert';
import { getCategoryLabel, normalizeCategoryWithFallback } from '@/utils/categories';
import type { DatasetMode, ThemeMode, SortKey, SortDirection, FilterState, A11yState, ExpertImportDialog } from '@/types/app';

export type { DatasetMode, ThemeMode, SortKey, SortDirection, FilterState, A11yState, ExpertImportDialog };

export type AppState = {
  dataset: DatasetMode;
  theme: ThemeMode;
  isOnline: boolean;
  filters: FilterState;
  ui: {
    selectedExpertId: string | null;
    selectedProjectId: string | null;
    hoveredProjectId: string | null;
    expertImportDialog: ExpertImportDialog | null;
  };
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
  setExpertImportDialog: (dialog: ExpertImportDialog | null) => void;
};

const initialFilters: FilterState = {
  searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc'
};

export const useAppStore = create<AppState>()(
  immer(devtools(
    (set) => ({
      dataset: 'cs',
    theme: 'light',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    filters: { ...initialFilters },
    ui: {
      selectedExpertId: null,
      selectedProjectId: null,
      hoveredProjectId: null,
      expertImportDialog: null,
    },
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
    setSelectedExpertId: (id) => set((s) => { s.ui.selectedExpertId = id; }),
    setSelectedProjectId: (id) => set((s) => { s.ui.selectedProjectId = id; }),
    setHoveredProjectId: (id) => set((s) => { s.ui.hoveredProjectId = id; }),
    setProjects: (projects) => set((s) => { s.data.projects = projects; }),
    setExperts: (experts) => set((s) => { s.data.experts = experts; }),
    setLoading: (loading) => set((s) => { s.data.loading = loading; }),
    setError: (error) => set((s) => { s.data.error = error; }),
    setA11y: (updates) => set((s) => { Object.assign(s.a11y, updates); }),
    addProject: (project) => {
      if (!project.leadExpertId || !project.leadExpertName) {
        console.warn('[store] addProject skipped: leadExpertId and leadExpertName are required');
        return;
      }
      set((s) => {
        const categoryId = normalizeCategoryWithFallback(project.categoryId, project.field);
        const defined = Object.fromEntries(
          Object.entries(project).filter(([_, v]) => v !== undefined)
        ) as Partial<ProjectData>;
        const complete = {
          id: project.id || crypto.randomUUID(),
          name: project.name || 'Untitled',
          status: project.status || 'planned',
          categoryId,
          field: getCategoryLabel(categoryId),
          description: project.description || '',
          location: project.location || `geometry('POINT(${project.lng || 25.0} ${project.lat || 47.5})', 4326)`,
          displayLocation: project.displayLocation || project.location || 'Unknown',
          yearRange: project.yearRange || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
          lat: project.lat || 47.5,
          lng: project.lng || 25.0,
          isCitizenScience: project.isCitizenScience ?? true,
          ...defined,
        } as ProjectData;
        s.data.projects.push(complete);
      });
    },
    addExpert: (expert) => set((s) => {
      const defined = Object.fromEntries(
        Object.entries(expert).filter(([_, v]) => v !== undefined)
      ) as Partial<ExpertData>;
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
        ...defined,
      } as ExpertData;
      s.data.experts.push(complete);
    }),
    setDraftPolygon: (coords) => set((s) => { s.draftPolygon = coords; }),
    setExpertImportDialog: (dialog) => set((s) => { s.ui.expertImportDialog = dialog; }),
    }),
    { name: 'carpathian-store', enabled: process.env.NODE_ENV === 'development' }
  ))
);
