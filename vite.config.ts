import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Aurea Backoffice Interno',
        short_name: 'Aurea Backoffice',
        description: 'Administración central de tenants, módulos, planes y permisos.',
        theme_color: '#171b1e',
        background_color: '#171b1e',
        display: 'standalone',
        start_url: '/login',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
})
