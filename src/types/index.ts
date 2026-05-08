export interface MapDrawingWrapperProps {
  center?: [number, number];
  zoom?: number;
  onPolygonCreated: (coords: [number, number][]) => void;
  areaCoords?: [number, number][];
}
