import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapView } from '../MapView';
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

vi.mock('../TileToggleWrapper', () => ({
  default: () => <div data-testid="tile-toggle-wrapper" />,
}));

vi.mock('../ProjectPolygon', () => ({
  ProjectPolygon: ({ projectName, onMouseOver, onMouseOut }: any) => (
    <div
      role="img"
      aria-label={`Project area: ${projectName}`}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      data-testid="polygon"
    />
  ),
}));

vi.mock('@/hooks/usePolygonLayer', () => ({
  usePolygonLayer: () => [{
    projectId: '1', coords: [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]],
    style: { fillColor: '#006633', fillOpacity: 0.2, color: '#4CAF50', weight: 2 }, isSelected: true,
  }],
}));

const mockProject = {
  id: '1', name: 'Test Project', status: 'active' as const, field: 'Biodiversity',
  description: 'A test project', location: 'Test Location', yearRange: '2024-2028',
  leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
  leadExpertName: 'Dr. Elena Popescu',
};

describe('HoverSync', () => {
  beforeEach(() => {
    useAppStore.setState({
      isOnline: true,
      dataset: 'cs',
      theme: 'light',
      data: { projects: [{ ...mockProject, lat: 47.5, lng: 25.0 } as any], experts: [], loading: false, error: null },
      filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name' as const, sortDirection: 'asc' as const },
      ui: { selectedExpertId: null, selectedProjectId: null, expertImportDialog: null, hoveredProjectId: null },
      draftPolygon: null,
      a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    });
  });

  it('renders map and polygons', () => {
    render(<MapView />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('polygon')).toBeInTheDocument();
  });
});
