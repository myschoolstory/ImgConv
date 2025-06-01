/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts', // Optional: if we need setup files
    // You can also pass configuration options for your chosen test runner
    // For example, if using vitest-canvas-mock:
    // setupFiles: './src/test/setupCanvas.ts',
    // deps: {
    //   inline: ['vitest-canvas-mock'],
    // },
  },
});
