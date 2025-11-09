import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase libraries
          'supabase': ['@supabase/supabase-js'],
          // UI and Icon libraries
          'ui-vendor': ['lucide-react'],
          // Chart libraries (if you're using recharts)
          'charts': ['recharts'],
        },
      },
    },
    // Increase chunk size warning limit to 1000 kB (optional)
    chunkSizeWarningLimit: 1000,
  },
})
