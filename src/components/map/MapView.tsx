import { useEffect } from 'react';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { useAppStore } from '@/store/appStore';
import TileToggleWrapper from './TileToggleWrapper';
import { ProjectPolygon } from './ProjectPolygon';
import { usePolygonLayer } from '@/hooks/usePolygonLayer';
// ✅ CSS imports guarded for SSR/build compatibility
if (typeof window !== 'undefined') {
  import('leaflet/dist/leaflet.css');
  // react-leaflet-markercluster CSS omitted - minimal styles inlined in cluster icon
}

type ClusterIconContext = {
  getChildCount(): number;
};

// ✅ Standard Vite asset imports (replaces broken inline base64)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapController = () => {
  const map = useMap();
  const { data, ui: { selectedProjectId }, setSelectedProjectId } = useAppStore();
  
  useEffect(() => {
    if (selectedProjectId && data.projects.length > 0) {
      const project = data.projects.find(p => p.id === selectedProjectId);
      if (project) map.flyTo([project.lat, project.lng], 10, { duration: 1.5 });
    }
  }, [selectedProjectId, data.projects, map]);

  useMapEvents({ click: () => setSelectedProjectId(null) });
  
  useEffect(() => {
    if (data.projects.length > 0 && !selectedProjectId) {
      const bounds = L.latLngBounds(data.projects.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [data.projects, map, selectedProjectId]);

  return null;
};

export const MapView = () => {
  const { data } = useAppStore();
  const hoveredProjectId = useAppStore(s => s.ui.hoveredProjectId);
  const setHoveredProjectId = useAppStore(s => s.setHoveredProjectId);
  const polygons = usePolygonLayer();

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-md border border-surface-muted relative" aria-label="Project map">
      <MapContainer center={[47.5, 25.0]} zoom={6} maxZoom={19} className="h-full w-full" zoomControl={false}>
        <MapController />
        
        {polygons.map(p => {
          const project = data.projects.find(pr => pr.id === p.projectId);
          return (
            <ProjectPolygon
              key={p.projectId}
              coords={p.coords}
              style={{
                ...p.style,
                fillOpacity: p.isSelected || hoveredProjectId === p.projectId ? 0.5 : p.style.fillOpacity,
                weight: p.isSelected || hoveredProjectId === p.projectId ? 3 : p.style.weight,
              }}
              onMouseOver={() => setHoveredProjectId(p.projectId)}
              onMouseOut={() => setHoveredProjectId(null)}
              projectId={p.projectId}
              projectName={project?.name ?? 'Untitled'}
              isSelected={p.isSelected}
            />
          );
        })}

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50} showCoverageOnHover={false} spiderfyOnMaxZoom iconCreateFunction={(cluster: ClusterIconContext) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div style="background:#006633;color:#fff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);">${count}</div>`,
            className: 'cluster-marker', iconSize: L.point(40, 40),
          });
        }}>
          {data.projects.map((project) => (
            <Marker key={project.id} position={[project.lat, project.lng]} eventHandlers={{ click: (e) => e.sourceTarget.openPopup() }}>
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <strong className="block text-primary-700">{project.name}</strong>
                  <span className="text-xs text-text-muted capitalize">{project.status} • {project.field}</span>
                  <button className="mt-2 text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 w-full" onClick={() => {
                    const el = document.getElementById(`project-card-${project.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}>Scroll to Card</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        
        {/* TileToggle now inside MapContainer with map context */}
        <TileToggleWrapper />
      </MapContainer>
    </div>
  );
};

export default MapView;
