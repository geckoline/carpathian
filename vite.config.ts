import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@store': path.resolve(__dirname, './src/store'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
      '@test-utils': path.resolve(__dirname, './src/test-utils'),
      'react-leaflet-markercluster/dist/styles.min.css': path.resolve(__dirname, './src/test-utils/cssStub.ts'),
      'zod': path.resolve(__dirname, './node_modules/zod'),
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
          if (id.includes('node_modules/react') || id.includes('node_modules/zustand')) return 'vendor';
          if (id.includes('node_modules/leaflet-draw')) return 'leaflet-draw';
          if (id.includes('node_modules/leaflet.markercluster') || id.includes('node_modules/react-leaflet-markercluster')) return 'leaflet-cluster';
          if (id.includes('node_modules/leaflet')) return 'leaflet';
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('@hookform')) return 'forms';
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge') || id.includes('node_modules/dompurify')) return 'utils';
        },
      },
    },
  },
}));
