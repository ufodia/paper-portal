import { defineConfig } from 'vite';
import { arucoCompat } from './scripts/aruco-compat.mjs';
export default defineConfig({
  base: './',
  plugins: [arucoCompat()],
  optimizeDeps: { exclude: ['js-aruco2'] },
  server: { host: '127.0.0.1' },
  build: { target: 'es2022' },
});
