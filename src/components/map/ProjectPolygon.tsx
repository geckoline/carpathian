import type { LatLngTuple } from 'leaflet';
import { Polygon, Tooltip } from 'react-leaflet';

interface ProjectPolygonProps {
  coords: LatLngTuple[];
  style: { fillColor: string; fillOpacity: number; color: string; weight: number };
  projectId: string;
  projectName: string;
  isSelected: boolean;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
}

export const ProjectPolygon = ({ coords, style, projectId, projectName, isSelected, onMouseOver, onMouseOut }: ProjectPolygonProps) => {
  return (
    <Polygon
      positions={coords}
      pathOptions={{
        ...style,
        fillOpacity: isSelected ? 0.45 : style.fillOpacity,
        weight: isSelected ? 3 : style.weight,
      }}
      eventHandlers={{
        click: () => {
          const el = document.getElementById(`project-card-${projectId}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        mouseover: onMouseOver,
        mouseout: onMouseOut,
      }}
      aria-label={`Project area: ${projectName}`}
    >
      <Tooltip direction="center" opacity={1} permanent={false} className="bg-white/90 backdrop-blur rounded px-2 py-1 text-xs font-medium shadow-sm border border-surface-muted">
        {projectName}
      </Tooltip>
    </Polygon>
  );
};

export default ProjectPolygon;
