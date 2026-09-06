import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  // Served at the origin root in development, but mounted under /merchant/ in
  // the combined single-deployment build (see scripts/build-all.mjs), which
  // sets SHOPNEAR_BASE. The router reads the same value via BASE_URL.
  base: process.env.SHOPNEAR_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
})
