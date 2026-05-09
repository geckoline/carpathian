import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapView } from '../MapView';

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

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((selector?: Function) => {
    const state = {
      data: {
        projects: [
          { id: '1', name: 'P1', status: 'active', field: 'Bio', lat: 47.5, lng: 25.0 },
          { id: '2', name: 'P2', status: 'past', field: 'Hydro', lat: 48.0, lng: 26.0 },
        ],
      },
      ui: { selectedProjectId: null, hoveredProjectId: null, setSelectedProjectId: vi.fn(), setHoveredProjectId: vi.fn() },
      filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc' },
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../ProjectPolygon', () => ({
  ProjectPolygon: ({ projectName }: any) => <div data-testid="polygon">{projectName}</div>,
}));

vi.mock('@/hooks/usePolygonLayer', () => ({
  usePolygonLayer: () => [{ projectId: '1', coords: [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]], style: { color: '#006633' }, isSelected: true }],
}));

describe('MapView', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders map container without error', () => {
    expect(() => render(<MapView />)).not.toThrow();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders map type control buttons', () => {
    render(<MapView />);
    expect(screen.getByText('Street View')).toBeInTheDocument();
    expect(screen.getByText('Satellite View')).toBeInTheDocument();
    expect(screen.getByText('Labels & Borders')).toBeInTheDocument();
  });

  it('renders markers for each project', () => {
    render(<MapView />);
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
  });

  it('renders cluster group', () => {
    render(<MapView />);
    expect(screen.getByTestId('cluster-group')).toBeInTheDocument();
  });

  it('renders polygons from polygon layer', () => {
    render(<MapView />);
    expect(screen.getByTestId('polygon')).toBeInTheDocument();
  });

  it('renders tile layers', () => {
    render(<MapView />);
    const tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers.length).toBeGreaterThanOrEqual(2);
  });
});
