import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { MapDrawingControl } from './MapDrawingControl';
import type { LatLngTuple } from 'leaflet';

interface MapDrawingWrapperProps {
  center?: [number, number];
  zoom?: number;
  onPolygonCreated: (coords: [number, number][]) => void;
  areaCoords?: [number, number][];
}

export const MapDrawingWrapper = ({ 
  center = [47.5, 25.0], 
  zoom = 6, 
  onPolygonCreated, 
  areaCoords 
}: MapDrawingWrapperProps) => {
  return (
    <MapContainer 
      center={center as [number, number]} 
      zoom={zoom} 
      className="h-full w-full" 
      zoomControl={false} 
      attributionControl={false}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
      />
      <MapDrawingControl onPolygonCreated={onPolygonCreated} />
      {areaCoords && (
        <Polygon positions={areaCoords as LatLngTuple[]} pathOptions={{ color: '#006633' }} />
      )}
    </MapContainer>
  );
};

export default MapDrawingWrapper;
