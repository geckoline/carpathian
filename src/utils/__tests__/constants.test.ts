import { describe, it, expect } from 'vitest';
import { DEFAULT_CENTER, MAP_ZOOM } from '../constants';

describe('constants', () => {
  it('DEFAULT_CENTER has Carpathian region coordinates', () => {
    expect(DEFAULT_CENTER.lat).toBe(47.5);
    expect(DEFAULT_CENTER.lng).toBe(25);
  });

  it('MAP_ZOOM has expected zoom levels', () => {
    expect(MAP_ZOOM.default).toBe(6);
    expect(MAP_ZOOM.selected).toBe(9);
    expect(MAP_ZOOM.fitBounds).toBe(12);
  });
});
