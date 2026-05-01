import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:8060'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor'
              }
              if (id.includes('react-router-dom')) {
                return 'router-vendor'
              }
              if (
                id.includes('@radix-ui/react-checkbox') ||
                id.includes('@radix-ui/react-label') ||
                id.includes('@radix-ui/react-slot') ||
                id.includes('@radix-ui/react-tabs')
              ) {
                return 'ui-vendor'
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
