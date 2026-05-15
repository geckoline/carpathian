import 'leaflet';

declare module 'leaflet' {
  namespace Control {
    class Draw extends Control {
      constructor(options?: unknown);
    }
  }

  namespace Draw {
    namespace Event {
      const CREATED: string;
    }
  }
}
