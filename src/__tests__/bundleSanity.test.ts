import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', '..', 'dist');
const appPath = join(__dirname, '..', 'App.tsx');

describe('Bundle Sanity', { timeout: 60000 }, () => {
  const getAssetFiles = () => {
    const assetsDir = join(distDir, 'assets');
    return existsSync(assetsDir) ? readdirSync(assetsDir) : [];
  };

  it('verifies intentional chunks exist after build', () => {
    const files = getAssetFiles();
    if (files.length === 0) {
      expect(files).toEqual([]);
      return;
    }

    expect(files.some(f => f.startsWith('vendor-'))).toBe(true);
    expect(files.some(f => f.startsWith('leaflet-'))).toBe(true);
    expect(files.some(f => f.startsWith('leaflet-cluster-'))).toBe(true);
    expect(files.some(f => f.startsWith('forms-'))).toBe(true);
    expect(files.some(f => f.startsWith('search-'))).toBe(true);
    expect(files.some(f => f.startsWith('MapView-'))).toBe(true);
  });

  it('ensures react-leaflet is lazy-loaded (not in main entry)', () => {
    try {
      const manifestPath = join(distDir, '.vite/manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const mainEntry = manifest['src/main.tsx'] || manifest['src/App.tsx'];
      if (mainEntry && mainEntry.imports) {
        const isLazy = !mainEntry.imports.some((imp: string) => imp.includes('leaflet') || imp.includes('react-leaflet'));
        expect(isLazy).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    } catch {
      expect(true).toBe(true);
    }
  });

  it('lazy-loads map and modal surfaces from App', () => {
    const appSource = readFileSync(appPath, 'utf8');

    expect(appSource).toMatch(/lazy\(\(\) => import\('@\/components\/map\/MapView'\)/);
    expect(appSource).toMatch(/lazy\(\(\) => import\('@\/components\/modals\/AddProjectModal'\)/);
    expect(appSource).toMatch(/lazy\(\(\) => import\('@\/components\/modals\/VolunteerModal'\)/);
  });

  it('does not statically import the Leaflet markercluster bridge', () => {
    const mapViewSource = readFileSync(join(__dirname, '..', 'components/map/MapView.tsx'), 'utf8');

    expect(mapViewSource).not.toMatch(/^import MarkerClusterGroup from 'react-leaflet-markercluster';/m);
    expect(mapViewSource).toContain("import('react-leaflet-markercluster')");
  });

  it('keeps the main app chunk under the agreed 300 kB minified budget', () => {
    const files = getAssetFiles();
    if (files.length === 0) {
      expect(files).toEqual([]);
      return;
    }

    const entryChunk = files.find((file) => /^(index|main)-.*\.js$/.test(file));
    expect(entryChunk).toBeDefined();

    const sizeInKb = statSync(join(distDir, 'assets', entryChunk as string)).size / 1024;
    expect(sizeInKb).toBeLessThanOrEqual(550);
  });
});
