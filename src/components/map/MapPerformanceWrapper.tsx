// src/components/map/MapPerformanceWrapper.tsx
import { Suspense, lazy, useState, useEffect } from 'react';

const LazyMapView = lazy(() => import('@/components/map/MapView'));

interface MapPerformanceWrapperProps {
  isVisible: boolean;
}

export const MapPerformanceWrapper = ({ isVisible }: MapPerformanceWrapperProps) => {
  const [mounted, setMounted] = useState(false);

  // Defer mount until in viewport or explicitly visible (prevents jank on initial load)
  useEffect(() => {
    if (isVisible && !mounted) setMounted(true);
  }, [isVisible, mounted]);

  if (!mounted) {
    return <div className="h-[400px] w-full rounded-xl bg-surface-muted flex items-center justify-center text-text-muted animate-pulse" aria-label="Map loading placeholder">Loading map...</div>;
  }

  return (
    <Suspense fallback={<div className="h-[400px] w-full rounded-xl bg-surface-muted flex items-center justify-center text-text-muted animate-pulse" aria-label="Map rendering placeholder">Initializing Leaflet...</div>}>
      <LazyMapView />
    </Suspense>
  );
};

export default MapPerformanceWrapper;
