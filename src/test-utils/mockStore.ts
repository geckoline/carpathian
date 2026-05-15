import { vi } from 'vitest';
import type { DatasetMode, ThemeMode } from '@/types/app';

const defaultState = {
  dataset: 'cs' as DatasetMode,
  theme: 'light' as ThemeMode,
  isOnline: true,
  filters: {
    searchTerm: '', statusFilter: 'all' as const, fieldFilter: 'all', countryFilter: 'all',
    activeTab: 'projects' as const, sortKey: 'name' as const, sortDirection: 'asc' as const,
  },
  ui: { selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null, expertImportDialog: null },
  data: { projects: [], experts: [], loading: false, error: null },
  a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
  draftPolygon: null,
  setA11y: vi.fn(),
  setTheme: vi.fn(),
  setDataset: vi.fn(),
  setActiveTab: vi.fn(),
  setOnlineStatus: vi.fn(),
  setSearchTerm: vi.fn(),
  setStatusFilter: vi.fn(),
  setFieldFilter: vi.fn(),
  setCountryFilter: vi.fn(),
  clearFilters: vi.fn(),
  setSelectedExpertId: vi.fn(),
  setSelectedProjectId: vi.fn(),
  setHoveredProjectId: vi.fn(),
  setDraftPolygon: vi.fn(),
  setExpertImportDialog: vi.fn(),
  setProjects: vi.fn(),
  setExperts: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  addProject: vi.fn(),
  addExpert: vi.fn(),
};

export type MockStoreState = typeof defaultState;

export const createMockAppStore = (overrides?: Partial<MockStoreState>) => {
  const state = { ...defaultState, ...overrides };
  return {
    useAppStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
};
