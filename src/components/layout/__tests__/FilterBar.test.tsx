import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../FilterBar';
import { useAppStore, AppState } from '@/store/appStore';

const createMockStore = (overrides: Partial<AppState> = {}) => {
  const base: AppState = {
    dataset: 'cs',
    theme: 'light',
    isOnline: true,
    filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const },
    ui: { isMapVisible: true, selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null },
    data: { projects: [], experts: [], loading: false, error: null },
    a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    draftPolygon: null,
    setDataset: vi.fn(),
    setTheme: vi.fn(),
    setOnlineStatus: vi.fn(),
    setSearchTerm: vi.fn(),
    setStatusFilter: vi.fn(),
    setFieldFilter: vi.fn(),
    setCountryFilter: vi.fn(),
    setActiveTab: vi.fn(),
    setSortKey: vi.fn(),
    setSortDirection: vi.fn(),
    clearFilters: vi.fn(),
    toggleMap: vi.fn(),
    setSelectedExpertId: vi.fn(),
    setSelectedProjectId: vi.fn(),
    setProjects: vi.fn(),
    setExperts: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    setA11y: vi.fn(),
    addProject: vi.fn(),
    addExpert: vi.fn(),
    setHoveredProjectId: vi.fn(),
    setDraftPolygon: vi.fn(),
  };
  return { ...base, ...overrides };
};

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel?: (s: AppState) => unknown) => {
    const store = createMockStore();
    return sel ? sel(store) : store;
  })
}));

describe('FilterBar', () => {
  it('renders search input with local state', () => {
    render(<FilterBar />);
    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
  });

  it('debounces search input to store', async () => {
    const setSearchTerm = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({ setSearchTerm });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    const input = screen.getByRole('textbox', { name: /search/i });
    await userEvent.type(input, 'hi');
    expect(setSearchTerm).not.toHaveBeenCalled();
  });

  it('calls status filter on select change', async () => {
    const setStatusFilter = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({ setStatusFilter });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    const select = screen.getByRole('combobox', { name: /status/i });
    await userEvent.selectOptions(select, 'active');
    expect(setStatusFilter).toHaveBeenCalledWith('active');
  });

  it('shows clear button when filters are active', async () => {
    const clearFilters = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore({ clearFilters, filters: { searchTerm: 'test', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const } });
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /clear all filters/i }));
    expect(clearFilters).toHaveBeenCalled();
  });

  it('does not show clear button when no filters are active', () => {
    vi.mocked(useAppStore).mockImplementation((sel?: (s: AppState) => unknown) => {
      const store = createMockStore();
      return sel ? sel(store) : store;
    });

    render(<FilterBar />);
    expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
  });
});
