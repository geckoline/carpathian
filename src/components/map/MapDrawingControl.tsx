// src/components/map/MapDrawingControl.tsx
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useAppStore } from '@/store/appStore';

interface MapDrawingControlProps {
  onPolygonCreated: (coords: [number, number][]) => void;
}

export const MapDrawingControl = ({ onPolygonCreated }: MapDrawingControlProps) => {
  const map = useMap();
  const setDraftPolygon = useAppStore(s => s.setDraftPolygon);
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;

    // Dynamic import to avoid server-side issues
    const initDrawControl = async () => {
      const L = await import('leaflet');
      await import('leaflet-draw');
      
      // Initialize layer group
      if (!drawnItemsRef.current) {
        drawnItemsRef.current = new L.FeatureGroup();
        map.addLayer(drawnItemsRef.current);
      }

      // Initialize Draw Control
      if (!drawControlRef.current) {
        const options = {
          position: 'topright' as const,
          draw: {
            polyline: false,
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: { color: '#006633' },
            },
          },
          edit: {
            featureGroup: drawnItemsRef.current,
            remove: true,
          },
        };

        drawControlRef.current = new (L.Control as any).Draw(options);
        map.addControl(drawControlRef.current);
      }

      // Handle created event
      const onCreated = (e: any) => {
        const layer = e.layer;
        if (layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs()[0] as L.LatLng[];
          const coords: [number, number][] = latlngs.map((pt: L.LatLng) => [pt.lat, pt.lng]);
          setDraftPolygon(coords);
          onPolygonCreated(coords);
          drawnItemsRef.current?.addLayer(layer);
        }
      };

      map.on((L as any).Draw.Event.CREATED, onCreated);

      return () => {
        map.off((L as any).Draw.Event.CREATED, onCreated);
        if (drawControlRef.current) map.removeControl(drawControlRef.current);
      };
    };

    let cleanup: (() => void) | undefined;
    initDrawControl().then((fn) => { cleanup = fn; });
    
    return () => { if (cleanup) cleanup(); };
  }, [map, onPolygonCreated]);

  return null;
};

export default MapDrawingControl;
