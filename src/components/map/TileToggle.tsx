import { MapIcon, GlobeIcon } from 'lucide-react';

type LayerType = 'street' | 'satellite';

interface TileToggleProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
}

export const TileToggle = ({ activeLayer, onLayerChange }: TileToggleProps) => {
  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-sm border border-surface-muted p-1 flex gap-1" role="group" aria-label="Map layer toggle">
      <button
        onClick={() => onLayerChange('street')}
        className={`p-1.5 rounded text-xs transition ${activeLayer === 'street' ? 'bg-primary-500 text-white' : 'text-text-muted hover:bg-surface-muted'}`}
        aria-pressed={activeLayer === 'street'}
        title="Street View"
      >
        <MapIcon size={14} />
      </button>
      <button
        onClick={() => onLayerChange('satellite')}
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
