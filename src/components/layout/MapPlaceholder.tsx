// src/components/layout/MapPlaceholder.tsx
export const MapPlaceholder = () => {
  return (
    <div className="h-[400px] w-full bg-surface-muted rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-text-muted" aria-label="Map visualization area">
      <span className="text-lg font-medium mb-2">🗺️ Interactive Map</span>
      <p className="text-sm text-center max-w-xs px-4">Leaflet integration will render project markers and region polygons here in Layer 4.</p>
    </div>
  );
};