// src/hooks/usePolygonLayer.ts
import { useMemo } from 'react';
import type { LatLngTuple } from 'leaflet';
import { useAppStore } from '@/store/appStore';
import { generateMockPolygon, getPolygonStyle, normalizeCoords } from '@/utils/polygonUtils';

export type PolygonLayerItem = {
  projectId: string;
  coords: LatLngTuple[];
  style: { fillColor: string; fillOpacity: number; color: string; weight: number };
  isSelected: boolean;
};

export const usePolygonLayer = (): PolygonLayerItem[] => {
  const { data, filters, ui: { selectedProjectId } } = useAppStore();

  return useMemo(() => {
    return data.projects
      .filter(p => {
        const matchesStatus = filters.statusFilter === 'all' || p.status === filters.statusFilter;
        const matchesField = filters.fieldFilter === 'all' || p.field.toLowerCase() === filters.fieldFilter.toLowerCase();
        return matchesStatus && matchesField;
      })
      .map(project => {
        const rawCoords = generateMockPolygon(project.lat, project.lng, 12, 6);
        return {
          projectId: project.id,
          coords: normalizeCoords(rawCoords),
          style: getPolygonStyle(project.status, project.field),
          isSelected: selectedProjectId === project.id,
        };
      });
  }, [data.projects, filters.statusFilter, filters.fieldFilter, selectedProjectId]);
};
