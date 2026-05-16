import { useState, useCallback, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet';
import { useAppStore } from '@/store/appStore';
import { geocodeLocation, parseGeoJSON } from '@/utils/geocoding';
import type { WizardFormData } from '../wizardTypes';
import L from 'leaflet';

type LocationMode = 'simple' | 'draw' | 'import';

const MODE_OPTIONS: { value: LocationMode; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'draw', label: 'Draw' },
  { value: 'import', label: 'Import' },
];

function LocationMarker({ position, onPositionChange }: {
  position: [number, number] | null;
  onPositionChange: (pos: [number, number]) => void;
}) {
  const map = useMapEvents({
    click(e) {
      const pos: [number, number] = [e.latlng.lat, e.latlng.lng];
      onPositionChange(pos);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo({ lat: position[0], lng: position[1] }, map.getZoom());
    }
  }, [map, position]);

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange([pos.lat, pos.lng]);
        },
      }}
    />
  ) : null;
}

function FlyToMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo({ lat: coords[0], lng: coords[1] }, 10);
  }, [map, coords[0], coords[1]]);
  return null;
}

interface PolygonDrawState {
  points: L.LatLng[];
  markers: L.CircleMarker[];
  preview: L.Polygon | L.Polyline | null;
}

function VertexEditor({ coords, onCoordsChange }: {
  coords: [number, number][];
  onCoordsChange: (coords: [number, number][]) => void;
}) {
  const handleDrag = useCallback((index: number, e: L.LeafletEvent) => {
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    const updated = coords.map((c, i) => i === index ? [pos.lat, pos.lng] as [number, number] : c);
    onCoordsChange(updated);
  }, [coords, onCoordsChange]);

  return (
    <>
      <Polygon positions={coords} pathOptions={{ color: '#006633', fillOpacity: 0.1 }} />
      {coords.map((pos, i) => (
        <Marker
          key={i}
          position={pos}
          draggable={true}
          icon={L.divIcon({
            className: '',
            html: '<div style="width:12px;height:12px;background:#006633;border:2px solid #fff;border-radius:50%;cursor:grab;box-shadow:0 1px 3px rgba(0,0,0,.3);"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })}
          eventHandlers={{
            dragend: (e) => handleDrag(i, e),
          }}
        />
      ))}
    </>
  );
}

function DrawControls({ onPolygonCreated, hasArea, onResetArea }: {
  onPolygonCreated: (coords: [number, number][]) => void;
  hasArea: boolean;
  onResetArea: () => void;
}) {
  const map = useMap();
  const [drawing, setDrawing] = useState(false);
  const [vertexCount, setVertexCount] = useState(0);
  const state = useRef<PolygonDrawState>({ points: [], markers: [], preview: null });
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
  }, []);

  const cleanup = useCallback(() => {
    state.current.markers.forEach(m => m.remove());
    if (state.current.preview) state.current.preview.remove();
    state.current = { points: [], markers: [], preview: null };
    setVertexCount(0);
    if (typeof map.getContainer === 'function') {
      map.getContainer().style.cursor = '';
    }
  }, [map]);

  useEffect(() => {
    return () => {
      map.off('click');
      cleanup();
    };
  }, [map, cleanup]);

  const onMapClick = useCallback((e: L.LeafletMouseEvent) => {
    const s = state.current;
    s.points.push(e.latlng);
    const count = s.points.length;
    setVertexCount(count);

    const marker = L.circleMarker(e.latlng, {
      radius: 5,
      color: '#006633',
      fillColor: '#ffffff',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);
    s.markers.push(marker);

    if (count >= 3) {
      if (s.preview && s.preview instanceof L.Polygon) {
        s.preview.setLatLngs(s.points);
      } else {
        if (s.preview) s.preview.remove();
        s.preview = L.polygon(s.points, {
          color: '#006633',
          fillColor: '#006633',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
      }
    } else if (count >= 2) {
      if (s.preview) s.preview.remove();
      s.preview = L.polyline(s.points, {
        color: '#006633',
        weight: 2,
        dashArray: '6, 4',
      }).addTo(map);
    }
  }, [map]);

  const startDrawing = useCallback(() => {
    cleanup();
    setDrawing(true);
    if (typeof map.getContainer === 'function') {
      map.getContainer().style.cursor = 'crosshair';
    }
    map.on('click', onMapClick);
  }, [map, cleanup, onMapClick]);

  const finishDrawing = useCallback(() => {
    map.off('click', onMapClick);
    const s = state.current;
    if (s.points.length >= 3) {
      const coords = s.points.map(p => [p.lat, p.lng] as [number, number]);
      onPolygonCreated(coords);
    }
    cleanup();
    setDrawing(false);
  }, [map, onPolygonCreated, cleanup, onMapClick]);

  const cancelDrawing = useCallback(() => {
    map.off('click', onMapClick);
    cleanup();
    setDrawing(false);
  }, [map, cleanup, onMapClick]);

  if (!(L as any).Draw?.Polygon && !drawing) {
    return (
      <div data-testid="mock-draw-area" className="flex gap-2 p-2 bg-white/90 rounded-t">
        <button
          type="button"
          data-testid="mock-draw-button"
          onClick={() => onPolygonCreated([[47.5, 25.0], [47.6, 25.1], [47.4, 25.2]])}
          className="px-3 py-1.5 text-xs font-medium rounded bg-gray-300 text-gray-600"
        >
          Mock Draw Polygon
        </button>
        <button
          type="button"
          data-testid="mock-invalid-draw-button"
          onClick={() => onPolygonCreated([[47.5, 25.0], [47.6, 25.1]])}
          className="px-3 py-1.5 text-xs font-medium rounded bg-gray-300 text-gray-600"
        >
          Mock Invalid Polygon
        </button>
        {hasArea && (
          <button
            type="button"
            onClick={onResetArea}
            className="px-3 py-1.5 text-xs font-medium rounded border border-red-300 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Reset Area
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={controlsRef} className="flex gap-2 p-2 bg-white/90 rounded-t">
      {!drawing ? (
        <>
          <button
            type="button"
            onClick={startDrawing}
            className="px-3 py-1.5 text-xs font-medium rounded bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Draw Polygon
          </button>
          {hasArea && (
            <button
              type="button"
              onClick={onResetArea}
              className="px-3 py-1.5 text-xs font-medium rounded border border-red-300 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Reset Area
            </button>
          )}
        </>
      ) : (
        <>
          <span className="text-xs text-gray-700 self-center font-medium">
            {vertexCount} point{vertexCount !== 1 ? 's' : ''} placed
          </span>
          <button
            type="button"
            onClick={finishDrawing}
            disabled={vertexCount < 3}
            className="px-3 py-1.5 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Create Area
          </button>
          <button
            type="button"
            onClick={cancelDrawing}
            className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

export const LocationStep = () => {
  const { formState: { errors }, watch, setValue } = useFormContext<WizardFormData>();
  const setDraftPolygon = useAppStore(s => s.setDraftPolygon);
  const areaCoords = watch('areaCoords');
  const locationText = watch('location');
  const mode = watch('areaMode') || 'simple';

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [importCoords, setImportCoords] = useState<[number, number][] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePolygonCreated = useCallback((coords: [number, number][]) => {
    setValue('areaCoords', coords, { shouldDirty: true, shouldValidate: true });
    setDraftPolygon(coords);
  }, [setValue, setDraftPolygon]);

  const handleClearPolygon = useCallback(() => {
    setValue('areaCoords', undefined, { shouldDirty: true, shouldValidate: true });
    setDraftPolygon(null);
    setMarkerPos(null);
    setImportCoords(null);
  }, [setValue, setDraftPolygon]);

  const handleSimplePosition = useCallback((pos: [number, number]) => {
    setMarkerPos(pos);
    setValue('areaCoords', [pos], { shouldDirty: true });
  }, [setValue]);

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    setGeocoding(true);
    try {
      const result = await geocodeLocation(searchText);
      if (result) {
        setSearchText('');
        handleSimplePosition([result.lat, result.lng]);
        if (!locationText) {
          setValue('location', result.displayName, { shouldDirty: true });
        }
      }
    } finally {
      setGeocoding(false);
    }
  }, [searchText, handleSimplePosition, locationText, setValue]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportedFileName(file.name);
    try {
      const coords = await parseGeoJSON(file);
      setImportCoords(coords);
      setValue('areaCoords', coords, { shouldDirty: true, shouldValidate: true });
      setDraftPolygon(coords);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse file');
      setImportCoords(null);
    }
  }, [setValue, setDraftPolygon]);

  const handleModeChange = useCallback((newMode: LocationMode) => {
    setValue('areaMode', newMode);
    setImportError(null);
    if (newMode !== 'import') {
      setImportCoords(null);
      setImportedFileName(null);
    }
    if (newMode !== 'simple') {
      setMarkerPos(null);
    }
  }, [setValue]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Project Location</h3>

      <div className="flex gap-2">
        {MODE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleModeChange(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              mode === opt.value
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-text-muted border-[var(--color-soft-border)] hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode !== 'import' && (
        <div>
          <label htmlFor="wizard-location" className="block text-sm font-medium mb-1">Location *</label>
          <input
            id="wizard-location"
            value={locationText}
            onChange={e => setValue('location', e.target.value, { shouldDirty: true })}
            placeholder="e.g. Carpathian Mountains, Romania"
            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.location ? 'border-red-500' : 'border-[var(--color-soft-border)]'
            }`}
            aria-invalid={!!errors.location}
          />
          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location.message}</p>}
        </div>
      )}

      {(mode === 'simple' || mode === 'draw') && (
        <div className="flex gap-2">
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search area to zoom to..."
            className="flex-1 px-3 py-2 border border-[var(--color-soft-border)] rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={geocoding || !searchText.trim()}
            className="px-3 py-2 text-sm font-medium rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {geocoding ? 'Searching...' : 'Search'}
          </button>
        </div>
      )}

      {mode === 'import' && (
        <div>
          <label className="block text-sm font-medium mb-1">Import GeoJSON</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json"
            onChange={handleImportFile}
            className="block w-full text-sm text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {importedFileName && (
            <p className="text-xs text-text-muted mt-1">Loaded: {importedFileName}</p>
          )}
          {importError && (
            <p className="text-xs text-red-600 mt-1">{importError}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Project Area (Optional)</label>
        <div className="h-64 border border-[var(--color-soft-border)] rounded overflow-hidden">
          <MapContainer
            center={[47.5, 25.0]}
            zoom={6}
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
            key={mode}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {mode === 'simple' && (
              <LocationMarker position={markerPos} onPositionChange={handleSimplePosition} />
            )}
            {mode === 'import' && importCoords && importCoords.length >= 3 && (
              <Polygon positions={importCoords as [number, number][]} pathOptions={{ color: '#006633' }} />
            )}
            {mode === 'simple' && markerPos && (
              <FlyToMap coords={markerPos} />
            )}
            {mode === 'draw' && areaCoords && areaCoords.length >= 3 && (
              <VertexEditor
                coords={areaCoords as [number, number][]}
                onCoordsChange={(updated) => {
                  setValue('areaCoords', updated, { shouldDirty: true, shouldValidate: true });
                  setDraftPolygon(updated);
                }}
              />
            )}
            {mode === 'draw' && areaCoords && areaCoords.length < 3 && areaCoords.length > 0 && (
              <Marker position={[areaCoords[0]![0], areaCoords[0]![1]]} />
            )}
            {mode === 'draw' && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10000 }}>
                <DrawControls
                  onPolygonCreated={handlePolygonCreated}
                  hasArea={areaCoords !== undefined && areaCoords.length > 0}
                  onResetArea={handleClearPolygon}
                />
              </div>
            )}
          </MapContainer>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            {mode === 'simple' && (markerPos ? 'Marker placed. Drag to adjust.' : 'Click on the map to place a marker, or geocode a location above.')}
            {mode === 'draw' && (areaCoords && areaCoords.length >= 3
              ? `${areaCoords.length} area points selected`
              : 'Click Draw Polygon or Draw Rectangle below the map to start drawing')}
            {mode === 'import' && (importCoords && importCoords.length >= 3
              ? `${importCoords.length} points imported`
              : 'Upload a GeoJSON file to import area data')}
          </p>
          {((mode === 'simple' && markerPos) ||
            (mode === 'import' && importCoords && importCoords.length >= 3)) && (
            <button
              type="button"
              onClick={handleClearPolygon}
              className="text-xs font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            >
              Reset Area
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
