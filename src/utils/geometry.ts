function perpendicularDistance(point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
}

function douglasPeucker(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

export function simplifyPolygon(
  coords: [number, number][],
  maxPoints: number = 200,
  tolerance?: number
): [number, number][] {
  if (coords.length <= maxPoints) return coords;
  if (coords.length <= 2) return coords;

  const toleranceValue = tolerance ?? calculateAdaptiveTolerance(coords, maxPoints);
  let simplified = douglasPeucker(coords, toleranceValue);

  let iterations = 0;
  while (simplified.length > maxPoints && iterations < 10) {
    const newTolerance = toleranceValue * (1 + (iterations + 1) * 0.5);
    simplified = douglasPeucker(coords, newTolerance);
    iterations++;
  }

  return simplified;
}

function calculateAdaptiveTolerance(coords: [number, number][], targetCount: number): number {
  const bbox = coords.reduce(
    (acc, [lat, lng]) => ({
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
    }),
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
  );

  const extent = Math.max(bbox.maxLat - bbox.minLat, bbox.maxLng - bbox.minLng);
  const ratio = coords.length / targetCount;

  return (extent / ratio) * 0.1;
}

export function generateAutoCircle(
  center: [number, number],
  radiusKm: number = 25,
  numPoints: number = 32
): [number, number][] {
  if (radiusKm <= 0) throw new Error('Radius must be positive');

  const [centerLat, centerLng] = center;
  const kmPerDegree = 111.32;
  const latRad = (centerLat * Math.PI) / 180;

  const radiusLat = radiusKm / kmPerDegree;
  const radiusLng = radiusKm / (kmPerDegree * Math.cos(latRad));

  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const dlat = radiusLat * Math.cos(angle);
    const dlng = radiusLng * Math.sin(angle);
    points.push([centerLat + dlat, centerLng + dlng]);
  }

  return points;
}
