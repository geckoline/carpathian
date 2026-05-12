import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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
  leadExpertId: '22222222-2222-4222-8222-222222222222',
  leadExpertName: 'Dr. Test Lead',
  lat: 47.5,
  lng: 25,
  country: 'Romania',
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
      ui: { isMapVisible: true, selectedExpertId: null, selectedProjectId: null, hoveredProjectId: null },
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
  });

  it('centers and pulses the selected map sidebar card', async () => {
    vi.useFakeTimers();
    render(<MapSidebar projects={[mappedProject]} />);

    const card = screen.getByRole('button', { name: /select mapped project on the map/i });
    const scrollIntoView = vi.fn();
    card.scrollIntoView = scrollIntoView;

    await act(async () => {
      useAppStore.setState({
        ui: {
          isMapVisible: true,
          selectedExpertId: null,
          selectedProjectId: mappedProject.id,
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
});
