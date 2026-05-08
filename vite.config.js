import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
export default defineConfig({
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
});
