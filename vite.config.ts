import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 
          https://pagead2.googlesyndication.com
          https://*.adtrafficquality.google
          https://*.doubleclick.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: blob: https:;
        connect-src 'self' 
          https://*.supabase.co 
          wss://*.supabase.co 
          https://*.elevenlabs.io 
          https://evmos-evm.publicnode.com/
          https://*.google.com
          https://*.googlesyndication.com
          https://*.adtrafficquality.google/;
        frame-src 'self' 
          https://www.google.com 
          https://pagead2.googlesyndication.com
          https://*.doubleclick.net
          https://*.adtrafficquality.google
          https://www.youtube.com
          https://youtube.com;
      `.replace(/\s+/g, ' ').trim()
    },
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: false
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  publicDir: 'public',
  assetsInclude: ['**/*.webp', '**/*.svg'], // WebP ve SVG dosyalarını asset olarak işle
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled']
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name].[hash][extname]';
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name].[hash][extname]';
          }
          if (assetInfo.name.endsWith('.js')) {
            return 'assets/js/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
})
