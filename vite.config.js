import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  server: {
    host: true,
    port: 5174,
    https: true,
    proxy: {
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '')
      }
    }
  },
  base: '/',
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase'
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-hot-toast')) {
            return 'vendor-ui'
          }
        },
      },
    },
  },
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'ELFAROUK Booking',
        short_name: 'ELF Booking',
        start_url: '/service-booking?v=3',
        scope: '/',
        display: 'standalone',
        background_color: '#0f2238',
        theme_color: '#153d65',
        shortcuts: [
          {
            name: 'حجز صيانة',
            short_name: 'حجز',
            url: '/service-booking',
          },
          {
            name: 'لوحة الإدارة',
            short_name: 'الإدارة',
            url: '/',
          },
        ],
        icons: [
          { src: '/elfarouk-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/elfarouk-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/elfarouk-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/elfarouk-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: { maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ],
})
