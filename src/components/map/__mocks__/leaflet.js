// Manual mock for leaflet - must be in __mocks__/leaflet.js
const mockFn = () => ({});
const mockConstructor = function() { return {}; };

module.exports = {
  default: {
    icon: mockFn,
    divIcon: mockFn,
    latLngBounds: () => ({ getCenter: () => [0, 0] }),
    Control: { 
      Draw: mockConstructor,
    },
    FeatureGroup: mockConstructor,
    Polygon: mockFn,
    Map: () => ({
      addLayer: mockFn,
      addControl: mockFn,
      removeControl: mockFn,
      on: mockFn,
      off: mockFn,
    }),
  },
  Control: { Draw: mockConstructor },
  FeatureGroup: mockConstructor,
  Polygon: mockFn,
};
