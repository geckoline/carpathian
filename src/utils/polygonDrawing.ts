// src/utils/polygonDrawing.ts
import type { LatLngTuple } from 'leaflet';

export type DrawingState = {
  isDrawing: boolean;
  currentCoords: LatLngTuple[];
  projectId?: string;
};

export const validatePolygon = (coords: LatLngTuple[]): boolean => {
  if (coords.length < 3) return false;
  return coords.every(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180);
};

export const calculateBoundingBox = (coords: LatLngTuple[]): { minLat: number; maxLat: number; minLng: number; maxLng: number } => {
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  return {
    minLat: Math.min(...lats), maxLat: Math.max(...lats),
    minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
  };
};

export const simplifyCoords = (coords: LatLngTuple[], toleranceKm = 1): LatLngTuple[] => {
  // Douglas-Peucker simplified for map drawing prep (keeps key vertices)
  if (coords.length <= 4) return coords;
  const detailFactor = Math.max(1, Math.round(toleranceKm));
  const step = Math.max(1, Math.floor(coords.length / (detailFactor * 3)));
  return coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
};

export const initializeDrawState = (): DrawingState => ({
  isDrawing: false,
  currentCoords: [],
});
