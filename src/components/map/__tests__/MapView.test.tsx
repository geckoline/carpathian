import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapView } from '../MapView';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);
const mapMocks = vi.hoisted(() => ({
  flyTo: vi.fn(),
  fitBounds: vi.fn(),
  invalidateSize: vi.fn(),
  mapContainer: document.createElement('div'),
  mapEvents: {} as Record<string, () => void>,
}));
const polygonLayerMocks = vi.hoisted(() => ({
  usePolygonLayer: vi.fn(),
}));
const storeMocks = vi.hoisted(() => ({
  selectedProjectId: null as string | null,
  hoveredProjectId: null as string | null,
  setSelectedProjectId: vi.fn(),
  setHoveredProjectId: vi.fn(),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, eventHandlers }: any) => (
    <div
      data-testid="marker"
      onClick={() => eventHandlers?.click?.({ sourceTarget: { openPopup: vi.fn() } })}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    flyTo: mapMocks.flyTo,
    fitBounds: mapMocks.fitBounds,
    on: vi.fn(),
    off: vi.fn(),
    invalidateSize: mapMocks.invalidateSize,
    getContainer: () => mapMocks.mapContainer,
  }),
  useMapEvents: (events: Record<string, () => void>) => {
    mapMocks.mapEvents = events;
    return null;
  },
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
  useAppStore: vi.fn((sel?: any) => createMockAppStore({
    data: {
      projects: [
        { id: '1', name: 'P1', status: 'active', field: 'Bio', lat: 47.5, lng: 25.0 },
        { id: '2', name: 'P2', status: 'past', field: 'Hydro', lat: 48.0, lng: 26.0 },
      ],
      experts: [],
      loading: false,
      error: null,
    },
    a11y: { fontSize: 16, highContrast: false, reducedMotion: false },
    ui: { selectedProjectId: storeMocks.selectedProjectId, hoveredProjectId: storeMocks.hoveredProjectId, selectedExpertId: null, expertImportDialog: null },
    filters: { searchTerm: '', statusFilter: 'all', fieldFilter: 'all', countryFilter: 'all', activeTab: 'projects', sortKey: 'name', sortDirection: 'asc' },
    setSelectedProjectId: storeMocks.setSelectedProjectId,
    setHoveredProjectId: storeMocks.setHoveredProjectId,
  }).useAppStore(sel)),
}));

vi.mock('../ProjectPolygon', () => ({
  ProjectPolygon: ({ projectName, isSelected, onMouseOver, onMouseOut, style }: any) => (
    <div
      data-testid="polygon"
      data-selected={String(isSelected)}
      data-fill-opacity={style.fillOpacity}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      {projectName}
    </div>
  ),
}));

vi.mock('@/hooks/usePolygonLayer', () => ({
  usePolygonLayer: polygonLayerMocks.usePolygonLayer,
}));

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMocks.selectedProjectId = null;
    storeMocks.hoveredProjectId = null;
    mapMocks.mapEvents = {};
    mapMocks.mapContainer = document.createElement('div');
    document.body.appendChild(mapMocks.mapContainer);
    polygonLayerMocks.usePolygonLayer.mockReturnValue([]);
  });

  afterEach(() => {
    mapMocks.mapContainer.remove();
    vi.useRealTimers();
  });

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

  it('exposes accessible pressed states for map controls', async () => {
    const user = userEvent.setup();
    render(<MapView />);

    const street = screen.getByRole('button', { name: 'Street View' });
    const satellite = screen.getByRole('button', { name: 'Satellite View' });
    const labels = screen.getByRole('button', { name: 'Labels & Borders' });

    expect(street).toHaveAttribute('aria-pressed', 'false');
    expect(satellite).toHaveAttribute('aria-pressed', 'true');
    expect(labels).toHaveAttribute('aria-pressed', 'true');

    await user.click(street);

    expect(street).toHaveAttribute('aria-pressed', 'true');
    expect(satellite).toHaveAttribute('aria-pressed', 'false');
    expect(labels).toHaveAttribute('aria-pressed', 'false');

    await user.click(labels);

    expect(labels).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders markers for each project', () => {
    render(<MapView />);
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
  });

  it('selects a project when a marker is clicked', async () => {
    const user = userEvent.setup();
    render(<MapView />);

    await user.click(screen.getAllByTestId('marker')[0]!);

    expect(storeMocks.setSelectedProjectId).toHaveBeenCalledWith('1');
  });

  it('scrolls the matching map sidebar card into view when a marker is clicked', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const sidebarCard = document.createElement('button');
    sidebarCard.id = 'map-sidebar-card-1';
    sidebarCard.scrollIntoView = scrollIntoView;
    document.body.appendChild(sidebarCard);

    render(<MapView />);

    await user.click(screen.getAllByTestId('marker')[0]!);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    sidebarCard.remove();
  });

  it('clears selected project when the map background is clicked', () => {
    render(<MapView />);

    mapMocks.mapEvents.click?.();

    expect(storeMocks.setSelectedProjectId).toHaveBeenCalledWith(null);
  });

  it('renders cluster group', () => {
    render(<MapView />);
    expect(screen.getByTestId('cluster-group')).toBeInTheDocument();
  });

  it('renders no polygons when nothing is selected', () => {
    render(<MapView />);
    expect(screen.queryByTestId('polygon')).not.toBeInTheDocument();
  });

  it('renders selected polygon when a project is selected', () => {
    polygonLayerMocks.usePolygonLayer.mockReturnValue([
      {
        projectId: '1',
        coords: [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]],
        style: { color: '#006633', fillColor: '#006633', fillOpacity: 0.3, weight: 2 },
        isSelected: true,
      },
    ]);

    render(<MapView />);
    const polygons = screen.getAllByTestId('polygon');
    expect(polygons).toHaveLength(1);
    expect(polygons[0]).toHaveAttribute('data-selected', 'true');
  });

  it('sets and clears hovered project from polygon hover', async () => {
    polygonLayerMocks.usePolygonLayer.mockReturnValue([
      {
        projectId: '1',
        coords: [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]],
        style: { color: '#006633', fillColor: '#006633', fillOpacity: 0.3, weight: 2 },
        isSelected: true,
      },
    ]);

    const user = userEvent.setup();
    render(<MapView />);
    const polygon = screen.getByTestId('polygon');

    await user.hover(polygon);
    expect(storeMocks.setHoveredProjectId).toHaveBeenCalledWith('1');

    await user.unhover(polygon);
    expect(storeMocks.setHoveredProjectId).toHaveBeenCalledWith(null);
  });

  it('renders tile layers', () => {
    render(<MapView />);
    const tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers.length).toBeGreaterThanOrEqual(2);
  });

  it('cancels delayed map resize work after unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(<MapView />);

    unmount();
    vi.advanceTimersByTime(100);

    expect(mapMocks.invalidateSize).not.toHaveBeenCalled();
  });

  it('fits bounds for visible projects when no project is selected', async () => {
    render(<MapView />);

    await waitFor(() => {
      expect(mapMocks.fitBounds).toHaveBeenCalled();
    });
  });

  it('flies to selected project and does not refit bounds while selected', async () => {
    storeMocks.selectedProjectId = '2';

    render(<MapView />);

    await waitFor(() => {
      expect(mapMocks.flyTo).toHaveBeenCalledWith([48.0, 26.0], 9, { duration: 1.5 });
    });
    expect(mapMocks.fitBounds).not.toHaveBeenCalled();
  });

  it('scrolls to the matching project card from popup action', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const card = document.createElement('div');
    card.id = 'project-card-1';
    card.scrollIntoView = scrollIntoView;
    document.body.appendChild(card);

    render(<MapView />);
    await user.click(screen.getAllByRole('button', { name: /scroll to card/i })[0]!);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    card.remove();
  });
});
