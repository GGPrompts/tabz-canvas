import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { canvasApiPlugin } from './vite-api-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), canvasApiPlugin()],
  server: {
    port: 5174, // Different from TabzChrome's dev server
    proxy: {
      // Proxy TabzChrome API requests
      '/tabz-api': {
        target: 'http://localhost:8129',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tabz-api/, '/api'),
      },
      // Proxy WebSocket connections
      '/tabz-ws': {
        target: 'ws://localhost:8129',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tabz-ws/, ''),
      },
    },
  },
})
