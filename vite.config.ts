/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'; // SVG support
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Final merged config
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    // Run `ANALYZE=true npm run build` to open an interactive bundle report.
    ...(process.env.ANALYZE
      ? [visualizer({ open: true, gzipSize: true, brotliSize: true })]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom'],
          charts: ['recharts', 'apexcharts', 'react-apexcharts'],
          // yup is only used in LeaveTypeFormModal.tsx — TODO: migrate to zod
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
          utils: ['axios', 'date-fns', 'date-fns-tz', 'uuid']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
  },
  // 🔊 Dev server on LAN IP & stable HMR
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
