import type { LatLngTuple } from 'leaflet';

export type PolygonStyle = {
  fillColor: string;
  fillOpacity: number;
  color: string;
  weight: number;
  dashArray?: string | null;
};

export const STATUS_COLORS: Record<string, string> = {
  active: '#006633',
  past: '#6B7280',
  planned: '#ff9900',
};

export const getPolygonStyle = (status: string, field?: string): PolygonStyle => {
  const baseStyles: Record<string, PolygonStyle> = {
    active: { color: '#006633', fillColor: '#006633', fillOpacity: 0.3, weight: 3 },
    past: { color: '#6B7280', fillColor: '#6B7280', fillOpacity: 0.2, weight: 2 },
    planned: { color: '#ff9900', fillColor: '#ff9900', fillOpacity: 0.25, weight: 3, dashArray: '5, 5' },
  };

  const style = baseStyles[status] ?? baseStyles.active!;
  const fieldType = field?.toLowerCase() || '';

  const fieldStyles: Record<string, Partial<PolygonStyle>> = {
    biodiversity: { fillColor: '#ADFF2F', color: '#9ACD32', fillOpacity: 0.35, weight: 2 },
    hydrology: { fillColor: '#00BFFF', color: '#1E90FF', fillOpacity: 0.35, weight: 2 },
    wildlife: { fillColor: '#32cd32', color: '#228B22', fillOpacity: 0.25, weight: 2 },
    climate: { fillColor: '#87CEEB', color: '#4682B4', fillOpacity: 0.3, weight: 2 },
    water: { fillColor: '#00BFFF', color: '#1E90FF', fillOpacity: 0.35, weight: 2 },
    forest: { fillColor: '#228B22', color: '#006400', fillOpacity: 0.4, weight: 2 },
    'spatial development': { fillColor: '#DEB887', color: '#A0522D', fillOpacity: 0.3, weight: 2 },
    agriculture: { fillColor: '#F4A460', color: '#D2691E', fillOpacity: 0.3, weight: 2 },
    tourism: { fillColor: '#FF69B4', color: '#DB7093', fillOpacity: 0.3, weight: 2 },
    'cultural heritage': { fillColor: '#DDA0DD', color: '#BA55D3', fillOpacity: 0.3, weight: 2 },
    'industry & energy': { fillColor: '#A9A9A9', color: '#808080', fillOpacity: 0.3, weight: 2 },
    'environmental assessment': { fillColor: '#B0C4DE', color: '#6495ED', fillOpacity: 0.3, weight: 2 },
    'education & awareness': { fillColor: '#FFD700', color: '#DAA520', fillOpacity: 0.3, weight: 2 },
    'climate change': { fillColor: '#87CEEB', color: '#4682B4', fillOpacity: 0.3, weight: 2 },
    air: { fillColor: '#B0E0E6', color: '#87CEEB', fillOpacity: 0.25, weight: 2 },
    geology: { fillColor: '#CD853F', color: '#8B4513', fillOpacity: 0.3, weight: 2 },
    pollution: { fillColor: '#DC143C', color: '#8B0000', fillOpacity: 0.3, weight: 2 },
    consumption: { fillColor: '#FFD700', color: '#FFA500', fillOpacity: 0.3, weight: 2 },
  };

  const fieldOverride = fieldStyles[fieldType];
  if (fieldOverride) {
    return { ...style, ...fieldOverride, dashArray: style.dashArray ?? null } as PolygonStyle;
  }

  return { ...style, dashArray: style.dashArray ?? null } as PolygonStyle;
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

const IRREGULARITY_OFFSETS = [0.0, 0.5, -0.3, 0.7, -0.5, 0.3, -0.7, 0.5, -0.2, 0.4];

export const generateRealisticPolygonWKT = (lat: number, lng: number, seed: number, baseRadiusKm = 15): string => {
  const earthRadius = 6378;
  const radius = baseRadiusKm + (seed % 5) * 3;
  const numPoints = 8 + (seed % 3);
  const points: string[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints + IRREGULARITY_OFFSETS[i % IRREGULARITY_OFFSETS.length]! * 0.08;
    const variation = 0.75 + ((IRREGULARITY_OFFSETS[i % IRREGULARITY_OFFSETS.length]! + 1) * 0.15);
    const r = radius * variation;
    const dlat = (r / earthRadius) * Math.cos(angle) * (180 / Math.PI);
    const dlng = (r / (earthRadius * Math.cos((Math.PI * lat) / 180))) * Math.sin(angle) * (180 / Math.PI);
    points.push(`${(lng + dlng).toFixed(4)} ${(lat + dlat).toFixed(4)}`);
  }
  points.push(points[0]!);

  return `geometry('POLYGON((${points.join(', ')}))', 4326)`;
};

export const normalizeCoords = (coords: LatLngTuple[]): LatLngTuple[] => {
  return coords
    .filter(([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
    .map(([lat, lng]) => [Math.round(lat * 1000) / 1000, Math.round(lng * 1000) / 1000]);
};
