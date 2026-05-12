import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const mapMock = vi.hoisted(() => ({
  addLayer: vi.fn(),
  addControl: vi.fn(),
  removeControl: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

const leafletMock = vi.hoisted(() => {
  class MockPolygon {
    private latlngs: Array<{ lat: number; lng: number }>;

    constructor(latlngs: Array<{ lat: number; lng: number }>) {
      this.latlngs = latlngs;
    }

    getLatLngs() {
      return [this.latlngs];
    }
  }

  const featureGroupAddLayer = vi.fn();
  class MockFeatureGroup {
    addLayer = featureGroupAddLayer;
  }

  class MockDrawControl {
    readonly id = 'draw-control';
  }

  return {
    drawAvailable: false,
    featureGroupAddLayer,
    DrawControl: MockDrawControl,
    FeatureGroup: MockFeatureGroup,
    Polygon: MockPolygon,
    setDraftPolygon: vi.fn(),
  };
});

vi.mock('react-leaflet', () => ({
  useMap: () => mapMock,
}));

vi.mock('leaflet', () => ({
  FeatureGroup: leafletMock.FeatureGroup,
  Control: {
    get Draw() {
      return leafletMock.drawAvailable ? leafletMock.DrawControl : undefined;
    },
  },
  get Draw() {
    return leafletMock.drawAvailable ? { Event: { CREATED: 'draw:created' } } : undefined;
  },
  Polygon: leafletMock.Polygon,
}));

vi.mock('leaflet-draw', () => ({}));

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((selector?: Function) => {
    const state = { setDraftPolygon: leafletMock.setDraftPolygon };
    return selector ? selector(state) : state;
  }),
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('MapDrawingControl - Module Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leafletMock.drawAvailable = false;
  });

  it('module exists and can be imported', async () => {
    const module = await import('../MapDrawingControl');
    expect(module).toBeDefined();
    expect(module.MapDrawingControl || module.default).toBeDefined();
  });

  it('does not initialize drawing when the Leaflet Draw plugin is unavailable', async () => {
    const { MapDrawingControl } = await import('../MapDrawingControl');

    render(<MapDrawingControl onPolygonCreated={vi.fn()} />);
    await flushPromises();

    expect(mapMock.addControl).not.toHaveBeenCalled();
    expect(mapMock.on).not.toHaveBeenCalled();
  });

  it('stores and emits coordinates from Leaflet Draw created events', async () => {
    leafletMock.drawAvailable = true;
    const onPolygonCreated = vi.fn();
    const { MapDrawingControl } = await import('../MapDrawingControl');

    render(<MapDrawingControl onPolygonCreated={onPolygonCreated} />);
    await waitFor(() => {
      expect(mapMock.on).toHaveBeenCalledWith('draw:created', expect.any(Function));
    });

    const createdHandler = mapMock.on.mock.calls.find(([eventName]) => eventName === 'draw:created')?.[1];
    expect(createdHandler).toBeTypeOf('function');

    const layer = new leafletMock.Polygon([
      { lat: 47.5, lng: 25.0 },
      { lat: 47.6, lng: 25.1 },
      { lat: 47.4, lng: 25.2 },
    ]);

    createdHandler({ layer });

    const coords = [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]];
    expect(leafletMock.setDraftPolygon).toHaveBeenCalledWith(coords);
    expect(onPolygonCreated).toHaveBeenCalledWith(coords);
    expect(leafletMock.featureGroupAddLayer).toHaveBeenCalledWith(layer);
  });
});
