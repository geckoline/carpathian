import { useMemo } from 'react';
import type { LatLngTuple } from 'leaflet';
import { useAppStore } from '@/store/appStore';
import { getPolygonStyle, generateMockPolygon, normalizeCoords } from '@/utils/polygonUtils';
import { getPolygonCoords } from '@/utils/geometryUtils';
import type { ProjectData } from '@/types/project';

export type PolygonLayerItem = {
  projectId: string;
  coords: LatLngTuple[];
  style: { fillColor: string; fillOpacity: number; color: string; weight: number };
  isSelected: boolean;
};

export const usePolygonLayer = (projects?: ProjectData[]): PolygonLayerItem[] => {
  const selectedProjectId = useAppStore(s => s.ui.selectedProjectId);
  const storeProjects = useAppStore(s => s.data.projects);
  const sourceProjects = projects ?? storeProjects;

  return useMemo(() => {
    if (!selectedProjectId) return [];

    const project = sourceProjects.find(p => p.id === selectedProjectId);
    if (!project) return [];

    const parsedCoords = getPolygonCoords(project.location);

    const coords = parsedCoords ?? normalizeCoords(
      generateMockPolygon(project.lat, project.lng, 12, 6)
    );

    return [{
      projectId: project.id,
      coords,
      style: getPolygonStyle(project.status, project.field),
      isSelected: true,
    }];
  }, [sourceProjects, selectedProjectId]);
};
