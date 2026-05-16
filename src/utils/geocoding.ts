import { COUNTRY_OPTIONS } from './countries';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  countryCode?: string;
}

export async function geocodeLocation(text: string): Promise<GeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      q: text,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    const data = await res.json();
    if (!data?.[0]) return null;
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      countryCode: result.address?.country_code?.toUpperCase(),
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    const data = await res.json();
    return data?.address?.country_code?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

export function getCountriesFromText(text: string): string[] {
  const lower = text.toLowerCase();
  return COUNTRY_OPTIONS
    .filter(c => lower.includes(c.name.toLowerCase()))
    .map(c => c.code);
}

export function parseGeoJSON(file: File): Promise<[number, number][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const coords = extractCoordsFromGeoJSON(json);
        if (coords.length < 3) {
          reject(new Error('GeoJSON must contain a polygon with at least 3 points'));
          return;
        }
        resolve(coords);
      } catch {
        reject(new Error('Invalid GeoJSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function extractCoordsFromGeoJSON(json: Record<string, unknown>): [number, number][] {
  if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
    for (const feature of json.features) {
      const coords = extractCoordsFromFeature(feature as Record<string, unknown>);
      if (coords.length >= 3) return coords;
    }
    return [];
  }
  if (json.type === 'Feature') {
    return extractCoordsFromFeature(json);
  }
  if (json.type === 'Polygon' || json.type === 'MultiPolygon') {
    return extractCoordsFromGeometry(json);
  }
  return [];
}

function extractCoordsFromFeature(feature: Record<string, unknown>): [number, number][] {
  if (!feature.geometry) return [];
  return extractCoordsFromGeometry(feature.geometry as Record<string, unknown>);
}

function extractCoordsFromGeometry(geometry: Record<string, unknown>): [number, number][] {
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    return (geometry.coordinates[0] as number[][]).map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
  }
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    for (const polygon of geometry.coordinates) {
      const coords = (polygon[0] as number[][]).map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      if (coords.length >= 3) return coords;
    }
    return [];
  }
  return [];
}
