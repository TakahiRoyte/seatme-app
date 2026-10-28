import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'apew-preview' ? [{
    name: 'preview-local-fonts',
    transformIndexHtml: (html: string) => html.split('\n').filter(line => !line.includes('https://fonts.googleapis.com') && !line.includes('https://fonts.gstatic.com')).join('\n'),
  }] : [])],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/firestore'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}))
