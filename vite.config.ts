import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/backend': {
        target: 'https://test.t-ecogroup.net',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
