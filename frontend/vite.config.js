import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Cấp phép cho domain ngrok của bạn (Lưu ý: chỉ lấy phần domain, không kèm theo https://)
    allowedHosts: [
      'clarinda-pseudotripteral-evolutionarily.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
      }
    }
  }
})