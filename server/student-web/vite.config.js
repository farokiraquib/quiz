import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/play/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/socket.io/') || url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          }
        ]
      },
      manifest: {
        name: 'LiveQuizz',
        short_name: 'LiveQuizz',
        description: 'Join live quiz games instantly',
        theme_color: '#09090e',
        background_color: '#09090e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/play/',
        start_url: '/play/',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
});
