import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapView } from '@/components/map/MapView';
import { ProjectCard } from '../ProjectCard';
import { useAppStore } from '@/store/appStore';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ flyTo: vi.fn(), fitBounds: vi.fn(), on: vi.fn(), off: vi.fn(), invalidateSize: vi.fn(), getContainer: () => document.createElement('div') }),
  useMapEvents: () => null,
}));

vi.mock('react-leaflet-markercluster', () => ({
  default: ({ children }: any) => <div data-testid="cluster-group">{children}</div>,
}));

vi.mock('leaflet', () => {
  const L = {
    icon: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn(() => ({ extend: vi.fn() })),
    point: vi.fn((x: number, y: number) => ({ x, y })),
    Marker: { prototype: { options: { icon: {} } } },
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
  };
  return { default: L, ...L };
});

vi.mock('@/components/map/TileToggleWrapper', () => ({
  default: () => <div data-testid="tile-toggle-wrapper" />,
}));

vi.mock('@/components/map/ProjectPolygon', () => ({
  ProjectPolygon: () => <div data-testid="polygon" />,
}));

vi.mock('@/hooks/usePolygonLayer', () => ({
  usePolygonLayer: () => [{
    projectId: '1', coords: [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]],
    style: { fillColor: '#006633', fillOpacity: 0.2, color: '#4CAF50', weight: 2 }, isSelected: true,
  }],
}));

const mockProject = {
  id: '1', name: 'Alpha Project', status: 'active' as const, field: 'Biodiversity',
  description: 'Monitoring forest health', location: 'Carpathians', yearRange: '2024-2028',
  leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
  leadExpertName: 'Dr. Elena Popescu',
  isCitizenScience: true, country: 'Romania',
};

describe('SmoothScroll', () => {
  let mockScroll: any;

  beforeEach(() => {
    Element.prototype.scrollIntoView = () => {};
    mockScroll = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    useAppStore.setState({
      data: { projects: [{ ...mockProject, lat: 47.5, lng: 25.0 } as any], experts: [], loading: false, error: null },
      filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const },
      ui: { selectedExpertId: null, selectedProjectId: null, expertImportDialog: null, hoveredProjectId: null },
      draftPolygon: null,
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    });
  });

  afterEach(() => {
    mockScroll.mockRestore();
  });

  it('calls scrollIntoView on map popup button', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MapView />
        <ProjectCard {...mockProject} />
      </div>
    );

    await screen.findByTestId('cluster-group');
    const btn = screen.getByRole('button', { name: /scroll to card/i });
    await user.click(btn);

    await waitFor(() => {
      expect(mockScroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });
  });

  it('uses auto scroll behavior when reduced motion is enabled', async () => {
    const user = userEvent.setup();
    useAppStore.setState((state) => ({
      ...state,
      a11y: { ...state.a11y, reducedMotion: true },
    }));

    render(
      <div>
        <MapView />
        <ProjectCard {...mockProject} />
      </div>
    );

    await screen.findByTestId('cluster-group');
    await user.click(screen.getByRole('button', { name: /scroll to card/i }));

    await waitFor(() => {
      expect(mockScroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
    });
  });
});
