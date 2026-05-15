import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import React from 'react';

expect.extend(axeMatchers);

vi.mock('focus-trap-react', () => ({
  default: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

vi.stubGlobal('__createMockAppStore', (overrides?: Record<string, unknown>) => {
  const defaultState = {
    dataset: 'cs', theme: 'light', isOnline: true,
    filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const },
    ui: { selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null, expertImportDialog: null },
    data: { projects: [], experts: [], loading: false, error: null },
    a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    draftPolygon: null,
    setA11y: vi.fn(), setTheme: vi.fn(), setDataset: vi.fn(), setActiveTab: vi.fn(),
    setOnlineStatus: vi.fn(), setSearchTerm: vi.fn(), setStatusFilter: vi.fn(), setFieldFilter: vi.fn(),
    setCountryFilter: vi.fn(), clearFilters: vi.fn(), setSelectedExpertId: vi.fn(), setSelectedProjectId: vi.fn(),
    setHoveredProjectId: vi.fn(), setDraftPolygon: vi.fn(), setExpertImportDialog: vi.fn(),
    setProjects: vi.fn(), setExperts: vi.fn(), setLoading: vi.fn(), setError: vi.fn(),
    addProject: vi.fn(), addExpert: vi.fn(),
  };
  const state = { ...defaultState, ...overrides };
  return {
    useAppStore: (selector?: (s: typeof defaultState) => unknown) =>
      selector ? selector(state) : state,
  };
});

if (typeof ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const testGlobals = globalThis as typeof globalThis & { ResizeObserver: typeof ResizeObserver };
  testGlobals.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
}

afterEach(() => {
  cleanup();
});
