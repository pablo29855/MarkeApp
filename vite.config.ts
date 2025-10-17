import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MarkeApp - Gestión de Gastos',
        short_name: 'MarkeApp',
        description: 'Aplicación para gestionar gastos, ingresos y deudas personales',
        theme_color: '#0f172a',
        background_color: '#fafbfc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar librerías grandes en chunks específicos
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'date-vendor': ['date-fns'],
          // ExcelJS se carga dinámicamente, no necesita chunk manual
          // 'excel-vendor': ['exceljs'],
          // Chunk para utilidades compartidas
          'utils': ['./src/lib/utils.ts', './src/lib/validation.ts', './src/lib/validation-messages.ts'],
          // Chunk para componentes UI más utilizados
          'ui-components': [
            './src/components/ui/button.tsx',
            './src/components/ui/input.tsx',
            './src/components/ui/card.tsx',
            './src/components/ui/table.tsx',
            './src/components/ui/dialog.tsx',
            './src/components/ui/select.tsx',
            './src/components/ui/badge.tsx',
            './src/components/ui/avatar.tsx',
            './src/components/ui/toast.tsx',
            './src/components/ui/sonner.tsx',
            './src/components/theme-provider.tsx',
            './src/components/theme-transition.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Aumentar el límite de warning a 1000kb
  },
})
