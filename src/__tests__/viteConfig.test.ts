import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('vite config', () => {
  it('uses vite.config.ts as the single active config source', () => {
    expect(existsSync(resolve(__dirname, '../../vite.config.ts'))).toBe(true);
    expect(existsSync(resolve(__dirname, '../../vite.config.js'))).toBe(false);
  });

  it('does not hardcode HMR port (Vite auto-detects to avoid port mismatch)', () => {
    const configPath = resolve(__dirname, '../../vite.config.ts');
    const config = readFileSync(configPath, 'utf-8');
    expect(config).not.toMatch(/hmr/);
  });

  it('keeps build chunk splitting in the TypeScript config', () => {
    const configPath = resolve(__dirname, '../../vite.config.ts');
    const config = readFileSync(configPath, 'utf-8');
    expect(config).toMatch(/manualChunks/);
    expect(config.indexOf("leaflet-draw")).toBeLessThan(config.indexOf("return 'leaflet'"));
    expect(config.indexOf("leaflet.markercluster")).toBeLessThan(config.indexOf("return 'leaflet'"));
    expect(config).toMatch(/return\s+['"]leaflet['"]/);
    expect(config).toMatch(/return\s+['"]leaflet-draw['"]/);
    expect(config).toMatch(/return\s+['"]leaflet-cluster['"]/);
    expect(config).toMatch(/return\s+['"]forms['"]/);
  });
});
