import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { useAppStore } from '@/store/appStore';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { ProjectPolygon } from './ProjectPolygon';
import { usePolygonLayer } from '@/hooks/usePolygonLayer';
import { STATUS_COLORS } from '@/utils/polygonUtils';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createCustomIcon = (status: string) => {
  const color = STATUS_COLORS[status] || '#006633';
  return L.divIcon({
    html: `<div style="width:24px;height:24px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker bg-transparent border-none',
    iconSize: L.point(24, 24),
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const MapController = ({ filteredProjects }: { filteredProjects: any[] }) => {
  const map = useMap();
  const { data, ui: { selectedProjectId }, setSelectedProjectId } = useAppStore();

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (selectedProjectId && data.projects.length > 0) {
      const project = data.projects.find(p => p.id === selectedProjectId);
      if (project) {
        map.flyTo([project.lat, project.lng], 12, { duration: 1.5 });
      }
    }
  }, [selectedProjectId, data.projects, map]);

  useMapEvents({
    click: () => setSelectedProjectId(null),
  });

  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProjectId) {
      const bounds = L.latLngBounds(filteredProjects.map((p: any) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [filteredProjects, map, selectedProjectId]);

  return null;
};

export const MapView = ({ projects: propProjects }: { projects?: any[] } = {}) => {
  const { data } = useAppStore();
  const projects = propProjects ?? data.projects;
  const { filteredProjects } = useProjectFilters(projects);
  const displayProjects = filteredProjects;
  const polygons = usePolygonLayer();
  const hoveredProjectId = useAppStore(s => s.ui.hoveredProjectId);
  const setHoveredProjectId = useAppStore(s => s.setHoveredProjectId);
  const setSelectedProjectId = useAppStore(s => s.setSelectedProjectId);

  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite');
  const [showLabels, setShowLabels] = useState(true);

  const handleMapTypeChange = (type: 'street' | 'satellite') => {
    setMapType(type);
    if (type === 'street') setShowLabels(false);
  };

  const toggleLabels = () => setShowLabels(prev => !prev);

  const selectedPolygons = polygons.filter(p => p.isSelected);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-3 py-2 bg-[#f8f9fa] border-b border-gray-200 z-[1000] relative">
        <div className="flex gap-3 flex-wrap">
          <button
            className={`px-4 py-1.5 text-sm border rounded-full transition font-medium ${
              mapType === 'street'
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => handleMapTypeChange('street')}
          >
            Street View
          </button>
          <button
            className={`px-4 py-1.5 text-sm border rounded-full transition font-medium ${
              mapType === 'satellite'
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => handleMapTypeChange('satellite')}
          >
            Satellite View
          </button>
          <button
            className={`px-4 py-1.5 text-sm border rounded-full transition font-medium ${
              showLabels
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            onClick={toggleLabels}
          >
            Labels & Borders
          </button>
        </div>
      </div>

      <div className="flex-1 relative min-h-[400px]">
          <MapContainer
            center={[46.5, 25.0]}
            zoom={6}
            className="h-full w-full"
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <MapController filteredProjects={displayProjects} />

          <TileLayer
            url={mapType === 'street'
              ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              : "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
            attribution=''
            maxZoom={19}
          />

          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=''
            opacity={showLabels ? 1 : 0}
            maxZoom={19}
          />

          {selectedPolygons.map(p => (
            <ProjectPolygon
              key={p.projectId}
              coords={p.coords}
              style={{
                ...p.style,
                fillOpacity: hoveredProjectId === p.projectId ? 0.5 : p.style.fillOpacity,
                weight: hoveredProjectId === p.projectId ? 3 : p.style.weight,
              }}
              onMouseOver={() => setHoveredProjectId(p.projectId)}
              onMouseOut={() => setHoveredProjectId(null)}
              projectId={p.projectId}
              projectName={data.projects.find(pr => pr.id === p.projectId)?.name || 'Unknown'}
              isSelected={true}
            />
          ))}

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            iconCreateFunction={(cluster: any) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `<div style="background:#006633; color:#fff; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);">${count}</div>`,
                className: 'cluster-marker',
                iconSize: L.point(40, 40),
              });
            }}
          >
            {displayProjects.map((project) => (
              <Marker
                key={project.id}
                position={[project.lat, project.lng]}
                icon={createCustomIcon(project.status)}
                eventHandlers={{
                  click: (e) => {
                    e.sourceTarget.openPopup();
                    setSelectedProjectId(project.id);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <strong className="block text-primary-700">{project.name}</strong>
                    <span className="text-xs text-text-muted capitalize">{project.status} • {project.field}</span>
                    <button
                      className="mt-2 text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 w-full"
                      onClick={() => {
                        const el = document.getElementById(`project-card-${project.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      Scroll to Card
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
