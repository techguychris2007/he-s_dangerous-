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
        orientation: 'portrait',
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
        // The main bundle passed 2 MiB once @supabase/supabase-js was added, then passed 5 MiB as
        // the Build Portal's SE task catalog (taskIndex.ts — metadata only, but eagerly imported by
        // BuildPortalPage) grew past 145 tasks. Same call each time: raise the workbox precache
        // ceiling instead of splitting chunks, so the whole app still works fully offline.
        maximumFileSizeToCacheInBytes: 9 * 1024 * 1024,
        runtimeCaching: [
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
          {
            // Same reasoning as the Pyodide rule above, for the Build Portal's Monaco editor: loaded
            // from the CDN on demand (not bundled/precached — see MonacoProjectEditor.tsx for why),
            // cached after first use so it works offline afterward. Version-pinned URL, so CacheFirst
            // is safe here too.
            urlPattern: ({ url }) => url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/monaco-editor@'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco-editor-runtime',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
