import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { canvasApiPlugin } from './vite-api-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), canvasApiPlugin()],
  server: {
    port: 5174, // Different from TabzChrome's dev server
  },
})
