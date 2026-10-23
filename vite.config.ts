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
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'DarkWorld — Cybersecurity Academy',
        short_name: 'DarkWorld',
        id: '/',
        description:
          'Pre-security foundations, offensive and defensive learning paths, interactive labs, and evidence-based learning portfolios.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0a1420',
        theme_color: '#101827',
        orientation: 'any',
        shortcuts: [
          { name: 'My learning', url: '/#/my-learning', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Lab catalog', url: '/#/labs', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Coding practice', url: '/#/code-portal', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        clientsClaim: true,
        // Precache every hashed build artifact (JS/CSS/fonts) plus the shell + icons, so the whole
        // app boots and runs with zero network requests once a single online visit has completed.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2,ttf}'],
        navigateFallback: '/index.html',
        // The main bundle passed 2 MiB once @supabase/supabase-js was added, then passed 5 MiB as
        // the Build Portal's SE task catalog (taskIndex.ts — metadata only, but eagerly imported by
        // BuildPortalPage) grew past 145 tasks. Same call each time: raise the workbox precache
        // ceiling instead of splitting chunks, so the whole app still works fully offline.
        maximumFileSizeToCacheInBytes: 9 * 1024 * 1024,
        runtimeCaching: [
          {
            // Reader PDFs are downloaded on demand rather than during install. The reader's
            // explicit "Save for offline" action stores one complete response; rangeRequests lets
            // PDF.js retrieve pages from that cached file while disconnected.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/books/') && /\.pdf$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'dw-books-offline-v1',
              rangeRequests: true,
              // The library has more than 20 distributable PDFs; retain each learner-selected book
              // rather than silently evicting older titles from a long offline reading list.
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/banners/') || /\.(?:jpg|jpeg)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'banner-images', expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            // The Pyodide (Python-in-WebAssembly) runtime the Code Portal loads on demand — not
            // precached (it's ~10-20MB), but cached after first use so re-running Python tasks
            // works offline too. jsDelivr versions its URLs, so CacheFirst is always safe here.
            urlPattern: ({ url }) => url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/pyodide/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide-runtime',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
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
