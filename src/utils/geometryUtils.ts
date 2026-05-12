import type { LatLngTuple } from 'leaflet';

export type ParsedGeometry =
  | { type: 'Point'; coordinates: LatLngTuple }
  | { type: 'Polygon'; coordinates: LatLngTuple[] }
  | null;

export function parseGeometryString(wkt: string): ParsedGeometry {
  const cleaned = wkt
    .replace(/^geometry\s*\(\s*'/i, '')
    .replace(/'\s*,\s*\d+\s*\)\s*$/, '')
    .trim();

  if (cleaned.startsWith('POINT(')) {
    const inner = cleaned.slice(6, -1).trim();
    const parts = inner.split(/\s+/).map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return { type: 'Point', coordinates: [parts[1], parts[0]] };
  }

  if (cleaned.startsWith('POLYGON((')) {
    const inner = cleaned.slice(9, -2).trim();
    const rings = inner.split('),(');
    const ring = rings[0];
    const coords = ring.split(',').map(p => {
      const [lng, lat] = p.trim().split(/\s+/).map(Number);
      return [lat, lng] as LatLngTuple;
    });
    if (coords.length < 3) return null;
    return { type: 'Polygon', coordinates: coords };
  }

  return null;
}

export function getPolygonCoords(wkt: string): LatLngTuple[] | null {
  const parsed = parseGeometryString(wkt);
  if (!parsed || parsed.type !== 'Polygon') return null;
  return parsed.coordinates;
}

export function isPointGeometry(wkt: string): boolean {
  const parsed = parseGeometryString(wkt);
  return parsed?.type === 'Point';
}
