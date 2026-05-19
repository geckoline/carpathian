import { Suspense, lazy, useEffect, useState, useMemo, useCallback, type ComponentType, type ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/store/appStore';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { ProjectPolygon } from './ProjectPolygon';
import { usePolygonLayer } from '@/hooks/usePolygonLayer';
import { STATUS_COLORS } from '@/utils/polygonUtils';
import type { ProjectData } from '@/types/project';
import { Map as MapIcon, Satellite, Tags } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

type LeafletDefaultIconPrototype = L.Icon.Default & { _getIconUrl?: unknown };
type LeafletRuntimeGlobal = typeof globalThis & { L?: typeof L };
type MarkerClusterGroupProps = {
  children?: ReactNode;
  chunkedLoading?: boolean;
  iconCreateFunction?: (cluster: ClusterIconContext) => L.Icon | L.DivIcon;
  maxClusterRadius?: number;
  showCoverageOnHover?: boolean;
  spiderfyOnMaxZoom?: boolean;
};

const MarkerClusterGroup = lazy(async () => {
  return import('react-leaflet-markercluster').then(mod => {
    (globalThis as LeafletRuntimeGlobal).L = L;
    return { default: mod.default as ComponentType<MarkerClusterGroupProps> };
  });
});

const SELECTED_PROJECT_ZOOM = 9;
const FIT_BOUNDS_MAX_ZOOM = 12;
const markerIconCache = new Map<string, L.DivIcon>();

const scrollElementIntoView = (id: string, reducedMotion: boolean) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'center',
  });
};

delete (L.Icon.Default.prototype as LeafletDefaultIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createCustomIcon = (status: string) => {
  const cached = markerIconCache.get(status);
  if (cached) return cached;

  const color = STATUS_COLORS[status] || '#006633';
  const icon = L.divIcon({
    html: `<div style="width:24px;height:24px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker bg-transparent border-none',
    iconSize: L.point(24, 24),
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
  markerIconCache.set(status, icon);
  return icon;
};

type ClusterIconContext = {
  getChildCount: () => number;
};

const createClusterIcon = (cluster: ClusterIconContext) => {
  const count = cluster.getChildCount();
  const label = `${count} projects in this area`;
  return L.divIcon({
    html: `<div role="img" aria-label="${label}" title="${label}" style="background:#006633; color:#fff; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.3);">${count}</div>`,
    className: 'cluster-marker',
    iconSize: L.point(40, 40),
  });
};

const mapControlClass = (isActive: boolean) => `inline-flex items-center gap-2 px-4 py-1.5 text-sm border rounded-full transition font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 ${
    isActive
      ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
      : 'bg-[var(--color-panel-surface)] text-text-muted border-[var(--color-soft-border)] hover:bg-[var(--color-panel-surface-soft)]'
  }`;

const MapController = ({ filteredProjects }: { filteredProjects: ProjectData[] }) => {
  const map = useMap();
  const projects = useAppStore(s => s.data.projects);
  const selectedProjectId = useAppStore(s => s.ui.selectedProjectId);
  const setSelectedProjectId = useAppStore(s => s.setSelectedProjectId);

  useEffect(() => {
    let isMounted = true;
    const container = map.getContainer();

    const invalidateSizeSafely = () => {
      if (!isMounted || !container.isConnected) return;

      try {
        map.invalidateSize();
      } catch {
        // Leaflet can throw while Vite HMR or route teardown detaches the map pane.
      }
    };

    const resizeTimers = [100, 350, 800].map((delay) => window.setTimeout(invalidateSizeSafely, delay));
    const observer = new ResizeObserver(invalidateSizeSafely);
    if (container.isConnected) observer.observe(container);

    return () => {
      isMounted = false;
      resizeTimers.forEach(window.clearTimeout);
      observer.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        map.flyTo([project.lat, project.lng], SELECTED_PROJECT_ZOOM, { duration: 1.5 });
      }
    }
  }, [selectedProjectId, projects, map]);

  useMapEvents({
    click: () => setSelectedProjectId(null),
  });

  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProjectId) {
      const bounds = L.latLngBounds(filteredProjects.map((project) => [project.lat, project.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: FIT_BOUNDS_MAX_ZOOM });
    }
  }, [filteredProjects, map, selectedProjectId]);

  return null;
};

export const MapView = ({ projects: propProjects }: { projects?: ProjectData[] } = {}) => {
  const storeProjects = useAppStore(s => s.data.projects);
  const projects = propProjects ?? storeProjects;
  const { filteredProjects } = useProjectFilters(projects);
  const displayProjects = filteredProjects;
  const polygons = usePolygonLayer(displayProjects);
  const setHoveredProjectId = useAppStore(s => s.setHoveredProjectId);
  const setSelectedProjectId = useAppStore(s => s.setSelectedProjectId);
  const reducedMotion = useAppStore(s => s.a11y.reducedMotion);

  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite');
  const [showLabels, setShowLabels] = useState(true);

  const handleMapTypeChange = useCallback((type: 'street' | 'satellite') => {
    setMapType(type);
    if (type === 'street') setShowLabels(false);
  }, []);

  const toggleLabels = useCallback(() => setShowLabels(prev => !prev), []);

  const projectNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.id, p.name);
    return map;
  }, [projects]);

  const handlePolygonHover = useCallback((projectId: string) => {
    setHoveredProjectId(projectId);
  }, []);
  const handlePolygonHoverEnd = useCallback(() => {
    setHoveredProjectId(null);
  }, []);
  const projectMarkers = useMemo(() => displayProjects.map((project) => (
    <Marker
      key={project.id}
      position={[project.lat, project.lng]}
      icon={createCustomIcon(project.status)}
      eventHandlers={{
        click: () => {
          setSelectedProjectId(project.id);
          scrollElementIntoView(`map-sidebar-card-${project.id}`, reducedMotion);
        },
      }}
    >
      <Popup>
        <div className="p-1 min-w-[200px]">
          <strong className="block text-primary-700">{project.name}</strong>
          <span className="text-xs text-text-muted capitalize">{project.status} • {project.field}</span>
          <button
            className="mt-2 text-xs px-2 py-1 bg-primary-500 text-white rounded-full hover:bg-primary-600 w-full transition focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => {
              scrollElementIntoView(`project-card-${project.id}`, reducedMotion);
            }}
          >
            Scroll to Card
          </button>
        </div>
      </Popup>
    </Marker>
  )), [displayProjects, setSelectedProjectId, reducedMotion]);

  return (
    <div className="flex h-full min-h-[420px] w-full flex-col overflow-hidden">
      <div className="px-3 py-2 bg-white/95 border-b border-[var(--color-panel-border)] z-[1000] relative">
        <div className="flex gap-3 flex-wrap">
          <button
            className={mapControlClass(mapType === 'street')}
            onClick={() => handleMapTypeChange('street')}
            aria-pressed={mapType === 'street'}
          >
            <MapIcon size={15} aria-hidden="true" />
            Street View
          </button>
          <button
            className={mapControlClass(mapType === 'satellite')}
            onClick={() => handleMapTypeChange('satellite')}
            aria-pressed={mapType === 'satellite'}
          >
            <Satellite size={15} aria-hidden="true" />
            Satellite View
          </button>
          <button
            className={mapControlClass(showLabels)}
            onClick={toggleLabels}
            aria-pressed={showLabels}
          >
            <Tags size={15} aria-hidden="true" />
            Labels & Borders
          </button>
        </div>
      </div>

      <div className="relative min-h-[340px] flex-1">
          <MapContainer
            center={[46.5, 25.0]}
            zoom={6}
            className="absolute inset-0 h-full w-full"
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

          {polygons.map(p => (
            <ProjectPolygon
              key={p.projectId}
              coords={p.coords}
              style={p.style}
              onMouseOver={() => handlePolygonHover(p.projectId)}
              onMouseOut={handlePolygonHoverEnd}
              projectId={p.projectId}
              projectName={projectNameLookup.get(p.projectId) ?? 'Unknown'}
              isSelected={p.isSelected}
            />
          ))}

          <Suspense fallback={projectMarkers}>
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              showCoverageOnHover={false}
              spiderfyOnMaxZoom
              iconCreateFunction={createClusterIcon}
            >
              {projectMarkers}
            </MarkerClusterGroup>
          </Suspense>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
