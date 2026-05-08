import { tileLayer } from 'leaflet';
import type { Map } from 'leaflet';
import { MapIcon, GlobeIcon } from 'lucide-react';

type LayerType = 'street' | 'satellite';
const layers: Record<LayerType, { url: string; attribution: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  }
};

interface TileToggleProps {
  map?: Map | null;
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
}

export const TileToggle = ({ map, activeLayer, onLayerChange }: TileToggleProps) => {
  const toggle = (type: LayerType) => {
    if (type === activeLayer) return;
    onLayerChange(type);

    if (!map) return; // Presentational mode — wrapper handles layers

    // Swap tiles imperatively
    map.eachLayer((layer) => {
      if ((layer as any)._url?.includes('openstreetmap') || (layer as any)._url?.includes('arcgis')) {
        map.removeLayer(layer);
      }
    });

    tileLayer(layers[type].url, { attribution: layers[type].attribution, maxZoom: 19 }).addTo(map);
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-sm border border-surface-muted p-1 flex gap-1" role="group" aria-label="Map layer toggle">
      <button
        onClick={() => toggle('street')}
        className={`p-1.5 rounded text-xs transition ${activeLayer === 'street' ? 'bg-primary-500 text-white' : 'text-text-muted hover:bg-surface-muted'}`}
        aria-pressed={activeLayer === 'street'}
        title="Street View"
      >
        <MapIcon size={14} />
      </button>
      <button
        onClick={() => toggle('satellite')}
        className={`p-1.5 rounded text-xs transition ${activeLayer === 'satellite' ? 'bg-primary-500 text-white' : 'text-text-muted hover:bg-surface-muted'}`}
        aria-pressed={activeLayer === 'satellite'}
        title="Satellite View"
      >
        <GlobeIcon size={14} />
      </button>
    </div>
  );
};

export default TileToggle;
