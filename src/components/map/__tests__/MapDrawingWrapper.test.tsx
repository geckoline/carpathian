import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapDrawingWrapper } from '../MapDrawingWrapper';

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Polygon: ({ positions }: any) => <div data-testid="polygon" data-positions={JSON.stringify(positions)} />,
}));

// Mock MapDrawingControl
vi.mock('../MapDrawingControl', () => ({
  MapDrawingControl: ({ onPolygonCreated }: any) => (
    <button 
      data-testid="draw-control" 
      onClick={() => onPolygonCreated([[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]])}
    >
      Draw Polygon
    </button>
  ),
}));

describe('MapDrawingWrapper', () => {
  it('renders map container', () => {
    const mockCallback = vi.fn();
    render(<MapDrawingWrapper onPolygonCreated={mockCallback} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders polygon when areaCoords provided', () => {
    const mockCallback = vi.fn();
    const coords: [number, number][] = [[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]];
    render(<MapDrawingWrapper onPolygonCreated={mockCallback} areaCoords={coords} />);
    expect(screen.getByTestId('polygon')).toBeInTheDocument();
  });
});
