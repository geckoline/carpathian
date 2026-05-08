// Simple smoke test for MapDrawingControl
// Since leaflet requires browser APIs (window, document), we test that the module loads without syntax errors

import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';

describe('MapDrawingControl - Module Loading', () => {
  it('module exists and can be imported', async () => {
    const module = await import('../MapDrawingControl');
    expect(module).toBeDefined();
    expect(module.MapDrawingControl || module.default).toBeDefined();
  });
});
