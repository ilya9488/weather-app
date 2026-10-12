import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const DAY = 24 * 60 * 60

export default defineConfig({
  // Relative base so the build works from any sub-path (GitHub Pages, etc.)
  base: './',
  plugins: [
    vue(),
    // Installable app (PWA): manifest + service worker with offline app shell
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Погода',
        short_name: 'Погода',
        description: 'Погода на сьогодні та на 5 днів',
        lang: 'uk',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#eef3ec',
        theme_color: '#eef3ec',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only the scripts the app needs for uk/en (no Greek / Vietnamese font files)
        globPatterns: [
          '**/*.{js,css,html,svg,png}',
          '**/*-{latin,latin-ext,cyrillic,cyrillic-ext}-*.woff2',
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Last loaded weather is shown when the network is unavailable
            urlPattern: ({ url }) =>
              url.hostname === 'api.openweathermap.org' && url.pathname.startsWith('/data/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-data',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 60, maxAgeSeconds: DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    // Use the runtime-only, production-friendly vue-i18n build
    __VUE_I18N_FULL_INSTALL__: false,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
})
