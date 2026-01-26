import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-checkbox', '@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-progress', '@radix-ui/react-slot', '@radix-ui/react-tabs', '@radix-ui/react-toast', 'lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
})
