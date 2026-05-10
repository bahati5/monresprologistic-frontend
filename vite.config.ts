import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [
      react(),
      tailwindcss(),
      // §21.7 — PWA avec mise en cache des ressources statiques pour mode hors-ligne partiel
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Monrespro Logistic',
          short_name: 'Monrespro',
          description: 'Gestion logistique et suivi de colis Monrespro',
          theme_color: '#1d4ed8',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/dashboard',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
          shortcuts: [
            {
              name: 'Mon tableau de bord',
              short_name: 'Dashboard',
              description: 'Accéder au tableau de bord',
              url: '/dashboard',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Suivre un colis',
              short_name: 'Suivi',
              description: 'Suivi de colis public',
              url: '/track',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          // Cache stratégies : pages statiques + API partiellement
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\/branding/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-branding',
                expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              urlPattern: /^https?:\/\/.*\/api\/track\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-tracking',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              },
            },
            {
              urlPattern: /^https?:\/\/.*\/storage\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'storage-assets',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//, /^\/storage\//],
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
    optimizeDeps: {
      include: [
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        // recharts importe des named exports depuis react-is (CJS) — forcer le pré-bundle + interop
        'recharts',
        'react-is',
      ],
      needsInterop: ['react-is'],
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/sanctum': { target: apiTarget, changeOrigin: true, secure: false },
        '/storage': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/sanctum': { target: apiTarget, changeOrigin: true, secure: false },
        '/storage': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
  }
})
