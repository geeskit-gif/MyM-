import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/MyM-/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png','icons/*.png'],
      manifest: {
        name: 'MyM for LilibetSP.',
        short_name: 'MyM',
        description: 'Mi ciclo, mi ritmo - MyM for LilibetSP. courtesy of geeskit.com 2026',
        theme_color: '#72C8D0',
        background_color: '#F7FBFA',
        display: 'standalone',
        start_url: '/MyM-/',
        icons: [
          { src: '/MyM-/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/MyM-/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/MyM-/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: { port: 5173 }
})
