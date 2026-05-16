import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfigFn from './vite.config';
import path from 'path';

const viteConfig = viteConfigFn({ mode: 'test', command: 'serve' });

export default mergeConfig(viteConfig, defineConfig({
  resolve: {
    alias: {
      '@store': path.resolve(__dirname, './src/store'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
      '@test-utils': path.resolve(__dirname, './src/test-utils'),
      'react-leaflet-markercluster/dist/styles.min.css': path.resolve(__dirname, './src/test-utils/cssStub.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-utils/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '**/carpathian-citizen-science-react18 Kopie/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './reports/coverage',
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
}));
