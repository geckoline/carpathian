import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import TileToggle from './TileToggle';

const TILES = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
};

export const TileToggleWrapper = () => {
  const map = useMap();
  const layersRef = useRef<Record<'street' | 'satellite', L.TileLayer | null>>({ street: null, satellite: null });
  const [active, setActive] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    if (!layersRef.current.street) {
      layersRef.current.street = L.tileLayer(TILES.street.url, { attribution: TILES.street.attribution, maxZoom: 19 });
      layersRef.current.satellite = L.tileLayer(TILES.satellite.url, { attribution: TILES.satellite.attribution, maxZoom: 19 });
    }
    layersRef.current.street.addTo(map);
    return () => {
      Object.values(layersRef.current).forEach(l => l?.remove());
    };
  }, [map]);

  const handleToggle = (type: 'street' | 'satellite') => {
    if (type === active || !layersRef.current[type]) return;
    Object.values(layersRef.current).forEach(l => l?.remove());
    layersRef.current[type]!.addTo(map);
    setActive(type);
  };

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      <TileToggle activeLayer={active} onLayerChange={handleToggle} />
    </div>
  );
};

export default TileToggleWrapper;
