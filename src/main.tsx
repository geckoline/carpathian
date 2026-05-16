import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const _domEventOn = L.DomEvent.on;
const _domEventOff = L.DomEvent.off;

function _filterTouchleave(types: string | Record<string, (e: any) => void>): string | Record<string, (e: any) => void> | null {
  if (typeof types === 'string') {
    const filtered = types.split(' ').filter(t => t !== 'touchleave').join(' ');
    return filtered || null;
  }
  if (typeof types === 'object' && types !== null) {
    const filtered: Record<string, (e: any) => void> = {};
    for (const key in types) {
      if (key !== 'touchleave') filtered[key] = types[key]!;
    }
    if (Object.keys(filtered).length === 0) return null;
    return filtered;
  }
  return types;
}

L.DomEvent.on = function(this: any, obj: any, types: any, fn?: any, context?: any) {
  const filtered = _filterTouchleave(types);
  if (!filtered) return L.DomEvent;
  (_domEventOn as any)(obj, filtered, fn, context);
  return L.DomEvent;
} as any;

L.DomEvent.off = function(this: any, obj: any, types: any, fn?: any, context?: any) {
  const filtered = _filterTouchleave(types);
  if (!filtered) return L.DomEvent;
  (_domEventOff as any)(obj, filtered, fn, context);
  return L.DomEvent;
} as any;

const rootElement = document.getElementById('citizen-science-root');
if (!rootElement) {
  throw new Error('Mount point #citizen-science-root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
