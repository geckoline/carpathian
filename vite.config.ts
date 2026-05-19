import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serpApiKey = env.SERPAPI_KEY
    ?? env.SERPAPI_API_KEY
    ?? env.GOOGLE_SCHOLAR_SERPAPI_KEY
    ?? env.VITE_SERPAPI_KEY
    ?? env.VITE_SERPAPI_API_KEY
    ?? env.VITE_GOOGLE_SCHOLAR_SERPAPI_KEY;

  return {
    base: './',
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
      proxy: {
        '/api/serpapi': {
          target: 'https://serpapi.com',
          changeOrigin: true,
          secure: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api\/serpapi/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (!serpApiKey) return;

              const pathWithQuery = proxyReq.path ?? '';
              const [pathname, query = ''] = pathWithQuery.split('?');
              const params = new URLSearchParams(query);
              if (!params.has('api_key')) params.set('api_key', serpApiKey);
              proxyReq.path = `${pathname}?${params.toString()}`;
            });
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'analyze', // ✅ Enable sourcemaps for bundle analysis
      minify: mode !== 'analyze', // ✅ Skip minification for analysis
      rollupOptions: {
        input: {
          app: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/zustand')) return 'vendor';
            if (id.includes('node_modules/leaflet.markercluster') || id.includes('node_modules/react-leaflet-markercluster')) return 'leaflet-cluster';
            if (id.includes('node_modules/leaflet')) return 'leaflet';
            if (id.includes('node_modules/fuse.js')) return 'search';
            if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('@hookform')) return 'forms';
            if (id.includes('node_modules/dompurify')) return 'utils';
          },
        },
      },
    },
  };
});
