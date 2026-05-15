import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'analyze' ? [visualizer({ filename: 'reports/bundle-analysis.html', open: true, gzipSize: true, brotliSize: true })] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'immer', 'lucide-react'],
  },
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'analyze', // ✅ Enable sourcemaps for bundle analysis
    minify: mode !== 'analyze', // ✅ Skip minification for analysis
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/zustand')) return 'vendor';
          if (id.includes('node_modules/leaflet-draw')) return 'leaflet-draw';
          if (id.includes('node_modules/leaflet.markercluster') || id.includes('node_modules/react-leaflet-markercluster')) return 'leaflet-cluster';
          if (id.includes('node_modules/leaflet')) return 'leaflet';
          if (id.includes('node_modules/fuse.js')) return 'search';
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('@hookform')) return 'forms';
          if (id.includes('node_modules/dompurify')) return 'utils';
        },
      },
    },
  },
}));
