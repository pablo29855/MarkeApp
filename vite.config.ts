import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
