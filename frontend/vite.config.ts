import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/events': 'http://localhost:8000',
      '/public': 'http://localhost:8000',
    },
  },
})
