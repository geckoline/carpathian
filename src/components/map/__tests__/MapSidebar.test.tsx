import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import MapSidebar from '../MapSidebar';
import { useAppStore } from '@/store/appStore';
import type { ProjectData } from '@/types/project';

const mappedProject: ProjectData = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Mapped Project',
  status: 'active',
  categoryId: 'biodiversity',
  field: 'Biodiversity',
  description: 'A mapped project with enough description for tests.',
  location: 'POINT(25 47.5)',
  displayLocation: 'Carpathian test valley',
  yearRange: '2021-2026',
  expertIds: ['22222222-2222-4222-8222-222222222222'],
  teamMembers: [{ id: '22222222-2222-4222-8222-222222222222', name: 'Dr. Test Lead' }],
  lat: 47.5,
  lng: 25,
  countries: ['RO'],
  isCitizenScience: true,
};

describe('MapSidebar', () => {
  beforeEach(() => {
    useAppStore.setState({
      filters: {
        searchTerm: '',
        statusFilter: 'all',
        fieldFilter: 'all',
        countryFilter: 'all',
        activeTab: 'projects',
        sortKey: 'name',
        sortDirection: 'asc',
      },
      ui: { selectedExpertId: null, selectedProjectId: null, expertImportDialog: null, hoveredProjectId: null },
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an accessible empty state when no mapped projects are visible', () => {
    render(<MapSidebar projects={[]} />);

    expect(screen.getByRole('heading', { name: /no mapped projects/i })).toBeInTheDocument();
    expect(screen.getByText(/use the filter bar above the cards/i)).toBeInTheDocument();
  });

  it('restores linked filtering controls in the map sidebar', () => {
    render(<MapSidebar projects={[mappedProject]} filterProjects={[mappedProject]} />);

    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /country/i })).toBeInTheDocument();
    expect(screen.getByTestId('map-sidebar-filters-controls')).toHaveClass('grid-cols-2');
  });

  it('uses polished category and subtle status pills on project list cards', () => {
    render(<MapSidebar projects={[
      { ...mappedProject, field: 'Industry & Infrastructure', categoryId: undefined },
      { ...mappedProject, id: '33333333-3333-4333-8333-333333333333', name: 'Planned Project', status: 'planned' },
      { ...mappedProject, id: '44444444-4444-4444-8444-444444444444', name: 'Past Project', status: 'past' },
    ]} />);

    const status = screen.getByTestId(`map-sidebar-status-${mappedProject.id}`);
    const category = screen.getByTestId(`map-sidebar-category-${mappedProject.id}`);

    expect(status).toHaveTextContent('Active');
    expect(status).toHaveClass('project-status-pill', 'project-status-pill-active');
    expect(category).toHaveTextContent('Infrastructure');
    expect(category).toHaveClass('project-category-pill');
    expect(category).toHaveAttribute('title', 'Industry & Infrastructure');
    expect(category).toHaveAttribute('aria-label', 'Category: Industry & Infrastructure');
    expect(screen.getByTestId('map-sidebar-status-33333333-3333-4333-8333-333333333333')).toHaveClass('project-status-pill-planned');
    expect(screen.getByTestId('map-sidebar-status-44444444-4444-4444-8444-444444444444')).toHaveClass('project-status-pill-past');
  });

  it('centers and pulses the selected map sidebar card', async () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<MapSidebar projects={[mappedProject]} />);

    const card = screen.getByRole('button', { name: /select mapped project on the map/i });

    await act(async () => {
      useAppStore.setState({
        ui: {
          selectedExpertId: null,
          selectedProjectId: mappedProject.id,
          expertImportDialog: null,
          hoveredProjectId: null,
        },
      });
    });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(card).toHaveClass('map-sidebar-card-pulse');

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(card).not.toHaveClass('map-sidebar-card-pulse');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MapSidebar projects={[mappedProject]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
