// src/utils/polygonUtils.ts
import type { LatLngTuple } from 'leaflet';

export type PolygonStyle = {
  fillColor: string;
  fillOpacity: number;
  color: string;
  weight: number;
};

const STATUS_COLORS: Record<string, string> = {
  active: '#006633',
  past: '#999999',
  planned: '#ff9900',
};

const FIELD_COLORS: Record<string, string> = {
  biodiversity: '#4CAF50',
  hydrology: '#2196F3',
  wildlife: '#FF9800',
  climate: '#9C27B0',
};

export const getPolygonStyle = (status: string, field?: string): PolygonStyle => {
  const baseFill = STATUS_COLORS[status] || STATUS_COLORS.planned;
  const stroke = FIELD_COLORS[field?.toLowerCase() || ''] || '#ffffff';
  return {
    fillColor: baseFill,
    fillOpacity: 0.25,
    color: stroke,
    weight: 2,
  };
};

export const generateMockPolygon = (lat: number, lng: number, radiusKm = 15, points = 8): LatLngTuple[] => {
  const earthRadius = 6378;
  const coords: LatLngTuple[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (2 * Math.PI * i) / points;
    const dlat = (radiusKm / earthRadius) * Math.cos(angle) * (180 / Math.PI);
    const dlng = (radiusKm / (earthRadius * Math.cos((Math.PI * lat) / 180))) * Math.sin(angle) * (180 / Math.PI);
    coords.push([lat + dlat, lng + dlng]);
  }
  return coords;
};

export const normalizeCoords = (coords: LatLngTuple[]): LatLngTuple[] => {
  return coords
    .filter(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
    .map(([lat, lng]) => [Math.round(lat * 1000) / 1000, Math.round(lng * 1000) / 1000]);
};
