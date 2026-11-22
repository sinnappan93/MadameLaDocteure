import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import { VitePWA } from 'vite-plugin-pwa';

/** ONNX Runtime (WebAssembly) livré avec l'appli pour la transcription : pas de CDN, fonctionne hors ligne et dans l'APK. */
const onnxRuntime = {
  name: 'onnx-runtime',
  apply: 'build' as const,
  closeBundle() {
    mkdirSync('dist/ort', { recursive: true });
    for (const f of ['ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.jsep.mjs']) copyFileSync(`node_modules/onnxruntime-web/dist/${f}`, `dist/ort/${f}`);
  },
};

export default defineConfig({
  base: './',
  worker: { format: 'es' },
  plugins: [
    react(),
    onnxRuntime,
    // Version web installable et utilisable hors ligne : l'appli (code, styles, polices, icônes) est gardée sur
    // l'appareil par un service worker ; les données sont déjà dans IndexedDB.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MadameLaDocteure',
        short_name: 'MadameLaDocteure',
        description: 'Préparation au concours de conservateur du patrimoine (option Inde et monde indianisé).',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f6f2ea',
        theme_color: '#14110f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // Transcription : chargée seulement si on s'en sert (gardée ensuite, voir plus bas).
        globIgnores: ['**/transcription.worker-*.js', 'ort/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/ort/') || url.pathname.includes('transcription.worker-'),
            handler: 'CacheFirst',
            options: { cacheName: 'transcription', cacheableResponse: { statuses: [200] } },
          },
          {
            // Fonds de carte déjà consultés, pour la carte des sites et le quiz hors ligne.
            urlPattern: ({ url }) => url.hostname === 'server.arcgisonline.com' || url.hostname === 'tile.openstreetmap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonds-de-carte',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
