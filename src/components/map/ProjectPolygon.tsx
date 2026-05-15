import { memo } from 'react';
import type { LatLngTuple } from 'leaflet';
import { Polygon, Tooltip } from 'react-leaflet';
import { useAppStore } from '@/store/appStore';

interface ProjectPolygonProps {
  coords: LatLngTuple[];
  style: { fillColor: string; fillOpacity: number; color: string; weight: number };
  projectId: string;
  projectName: string;
  isSelected: boolean;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
}

export const ProjectPolygon = memo(({ coords, style, projectId, projectName, isSelected, onMouseOver, onMouseOut }: ProjectPolygonProps) => {
  const setSelectedProjectId = useAppStore(s => s.setSelectedProjectId);

  return (
    <Polygon
      positions={coords}
      pathOptions={{
        ...style,
        fillOpacity: isSelected ? 0.6 : style.fillOpacity,
        weight: isSelected ? 4 : style.weight,
        color: isSelected ? '#ff9900' : style.color,
      }}
      eventHandlers={{
        click: () => setSelectedProjectId(projectId),
        mouseover: onMouseOver,
        mouseout: onMouseOut,
      }}
      aria-label={`Project area: ${projectName}`}
    >
      <Tooltip
        direction="center"
        opacity={1}
        permanent={false}
        className="bg-white/90 backdrop-blur rounded px-2 py-1 text-xs font-medium shadow-sm border border-surface-muted"
      >
        {projectName}
      </Tooltip>
    </Polygon>
  );
});
