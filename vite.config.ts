import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages Project-Site: served under /gesundheitstagebuch/
const BASE = '/gesundheitstagebuch/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      // Neue Version wird angekündigt (UpdateHinweis) statt still aktiviert
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        // Bewusst diskreter Name / kein Symptombezug im Klartext
        name: 'Tagebuch',
        short_name: 'Tagebuch',
        description: 'Persönliches Tagebuch',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${BASE}index.html`,
      },
    }),
  ],
});
