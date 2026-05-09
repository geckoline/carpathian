import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';

const rootElement = document.getElementById('citizen-science-root');
if (!rootElement) {
  throw new Error('Mount point #citizen-science-root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
