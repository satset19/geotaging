import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

// Vite config: React + HTTPS dev server (wajib untuk getUserMedia/Geolocation lewat LAN)
// + PWA (installable, offline-ready app shell, TIDAK cache tile peta sesuai ToS Google)
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'GeoDjengs - Geotag Camera',
        short_name: 'GeoDjengs',
        description:
          'Kamera dengan watermark lokasi otomatis (alamat, koordinat, peta) via OpenStreetMap',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'id',
        scope: '/',
        start_url: '/',
        categories: ['photo', 'navigation', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache hanya app shell; JANGAN cache tile OSM / Nominatim (menghormati usage policy).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname === 'tile.openstreetmap.org' ||
              url.hostname === 'nominatim.openstreetmap.org',
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // expose ke LAN agar bisa diakses dari HP
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
