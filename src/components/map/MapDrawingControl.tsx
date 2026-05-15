import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useAppStore } from '@/store/appStore';
import L from 'leaflet';
import 'leaflet-draw';

interface MapDrawingControlProps {
  onPolygonCreated: (coords: [number, number][]) => void;
}

export const MapDrawingControl = ({ onPolygonCreated }: MapDrawingControlProps) => {
  const map = useMap();
  const setDraftPolygon = useAppStore(s => s.setDraftPolygon);
  const drawControlRef = useRef<L.Control | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;

    const LAny = L as Record<string, unknown>;
    const drawCreatedEvent = LAny.Draw
      ? (LAny.Draw as Record<string, unknown>).Event
      : undefined;
    if (!LAny.Control || !(LAny.Control as Record<string, unknown>).Draw || !drawCreatedEvent) {
      console.warn('[MapDrawingControl] leaflet-draw not available — drawing disabled');
      return;
    }

    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);
    }

    if (!drawControlRef.current) {
      drawControlRef.current = new L.Control.Draw({
        position: 'topright',
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
      });
      map.addControl(drawControlRef.current);
    }

    const onCreated = (e: { layer: unknown }) => {
      const layer = e.layer as L.Polygon;
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const coords: [number, number][] = latlngs.map((pt: L.LatLng) => [pt.lat, pt.lng]);
        setDraftPolygon(coords);
        onPolygonCreated(coords);
        drawnItemsRef.current?.addLayer(layer);
      }
    };

    map.on(L.Draw.Event.CREATED, onCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      if (drawControlRef.current) map.removeControl(drawControlRef.current);
    };
  }, [map, onPolygonCreated, setDraftPolygon]);

  return null;
};

export default MapDrawingControl;
