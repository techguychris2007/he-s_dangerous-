import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Auto-updates the service worker in the background the moment a new build is online,
      // while still serving the last fully-cached build instantly to anyone currently offline.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'DarkWorld — Learn Offensive Security',
        short_name: 'DarkWorld',
        description:
          '14 modules, 142 hands-on labs, hidden flags and quizzes — a full offensive security curriculum with a real in-browser terminal.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f4f6fb',
        theme_color: '#2563eb',
        orientation: 'any',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache every hashed build artifact (JS/CSS/fonts) plus the shell + icons, so the whole
        // app boots and runs with zero network requests once a single online visit has completed.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/banners/') || /\.(?:jpg|jpeg)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'banner-images', expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
      devOptions: {
        // Service workers behave unreliably against Vite's dev server (unbundled modules, HMR
        // websocket). Validate real offline/online behavior against `npm run build && npm run preview`.
        enabled: false,
      },
    }),
  ],
})
