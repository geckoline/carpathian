// src/components/map/MapDrawingControl.tsx
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useAppStore } from '@/store/appStore';
import type * as Leaflet from 'leaflet';

type LeafletDrawApi = typeof Leaflet & {
  Control: typeof Leaflet.Control & {
    Draw?: new (options: unknown) => Leaflet.Control;
  };
  Draw?: {
    Event?: {
      CREATED?: string;
    };
  };
};

const getOptionalProperty = <T extends object, K extends PropertyKey>(object: T, key: K) => {
  try {
    return (object as Record<K, unknown>)[key];
  } catch {
    return undefined;
  }
};

interface MapDrawingControlProps {
  onPolygonCreated: (coords: [number, number][]) => void;
}

export const MapDrawingControl = ({ onPolygonCreated }: MapDrawingControlProps) => {
  const map = useMap();
  const setDraftPolygon = useAppStore(s => s.setDraftPolygon);
  const drawControlRef = useRef<Leaflet.Control | null>(null);
  const drawnItemsRef = useRef<Leaflet.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;

    // Dynamic import to avoid server-side issues
    const initDrawControl = async () => {
      const leaflet = await import('leaflet');
      await import('leaflet-draw');
      const defaultExport = Object.prototype.hasOwnProperty.call(leaflet, 'default')
        ? (leaflet as typeof leaflet & { default?: unknown }).default
        : undefined;
      const L = (defaultExport ?? leaflet) as LeafletDrawApi;
      const DrawControl = getOptionalProperty(L.Control, 'Draw') as LeafletDrawApi['Control']['Draw'] | undefined;
      const Draw = getOptionalProperty(L, 'Draw') as LeafletDrawApi['Draw'] | undefined;
      const drawCreatedEvent = Draw?.Event?.CREATED;

      if (!DrawControl || !drawCreatedEvent) {
        return undefined;
      }
      
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

        drawControlRef.current = new DrawControl(options);
        map.addControl(drawControlRef.current);
      }

      // Handle created event
      const onCreated = (e: { layer: unknown }) => {
        const layer = e.layer;
        if (layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs()[0] as L.LatLng[];
          const coords: [number, number][] = latlngs.map((pt: L.LatLng) => [pt.lat, pt.lng]);
          setDraftPolygon(coords);
          onPolygonCreated(coords);
          drawnItemsRef.current?.addLayer(layer as Leaflet.Layer);
        }
      };

      map.on(drawCreatedEvent, onCreated);

      return () => {
        map.off(drawCreatedEvent, onCreated);
        if (drawControlRef.current) map.removeControl(drawControlRef.current);
      };
    };

    let cleanup: (() => void) | undefined;
    let cancelled = false;
    initDrawControl().then((fn) => {
      if (cancelled) {
        fn?.();
        return;
      }
      cleanup = fn;
    });
    
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [map, onPolygonCreated, setDraftPolygon]);

  return null;
};

export default MapDrawingControl;
