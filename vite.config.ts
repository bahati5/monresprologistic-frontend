import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      // /storage : exiger `php artisan storage:link` + fichiers sous storage/app/public (ex. branding).
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/sanctum': { target: apiTarget, changeOrigin: true, secure: false },
        '/storage': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/sanctum': { target: apiTarget, changeOrigin: true, secure: false },
        '/storage': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
  }
})
