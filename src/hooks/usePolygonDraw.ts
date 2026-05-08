import { useState, useCallback, useRef } from 'react';
import type { Map, LayerGroup } from 'leaflet';

export type PolygonDrawState = {
  isDrawing: boolean;
  coords: [number, number][];
  error: string | null;
};

export const usePolygonDraw = (map: Map | null) => {
  const [state, setState] = useState<PolygonDrawState>({
    isDrawing: false,
    coords: [],
    error: null,
  });
  const drawnLayerRef = useRef<LayerGroup | null>(null);

  const validateCoords = useCallback((coords: [number, number][]): string | null => {
    if (coords.length < 3) return 'Polygon requires at least 3 points';
    const invalid = coords.find(([lat, lng]) => 
      lat < -90 || lat > 90 || lng < -180 || lng > 180
    );
    if (invalid) return `Invalid coordinates: ${invalid[0]}, ${invalid[1]}`;
    return null;
  }, []);

  const startDrawing = useCallback(() => {
    if (!map) return;
    setState({ isDrawing: true, coords: [], error: null });
  }, [map]);

  const addPoint = useCallback((lat: number, lng: number) => {
    setState(prev => {
      const newCoords = [...prev.coords, [lat, lng] as [number, number]];
      const error = validateCoords(newCoords);
      return { ...prev, coords: newCoords, error };
    });
  }, [validateCoords]);

  const finishDrawing = useCallback(() => {
    const error = validateCoords(state.coords);
    if (error) {
      setState(prev => ({ ...prev, error }));
      return false;
    }
    setState(prev => ({ ...prev, isDrawing: false }));
    return true;
  }, [state.coords, validateCoords]);

  const clearDrawing = useCallback(() => {
    setState({ isDrawing: false, coords: [], error: null });
    if (drawnLayerRef.current) {
      drawnLayerRef.current.remove();
      drawnLayerRef.current = null;
    }
  }, []);

  return {
    ...state,
    startDrawing,
    addPoint,
    finishDrawing,
    clearDrawing,
  };
};
