import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Only use base path for production builds (GitHub Pages)
  base: command === 'build' ? '/books/' : '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
}))
