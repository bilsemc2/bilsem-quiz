import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    })
  ],
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self' data: blob: https:;",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.adtrafficquality.google https://*.doubleclick.net https://www.googletagmanager.com https://www.google-analytics.com blob:;",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
        "font-src 'self' https://fonts.gstatic.com data: blob:;",
        "img-src 'self' data: blob: https:;",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.elevenlabs.io https://evmos-evm.publicnode.com/ https://*.google.com https://*.googleapis.com https://*.googlesyndication.com https://*.adtrafficquality.google/ https://*.doubleclick.net https://*.openai.com https://www.google-analytics.com https://region1.google-analytics.com https://*.googletagmanager.com data:;",
        "frame-src 'self' https://www.google.com https://pagead2.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://www.youtube.com https://youtube.com;",
        "worker-src 'self' blob: data:;",
        "child-src 'self' blob: data:;"
      ].join(' ')
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
      '@': resolve(__dirname, './src'),
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
    ]
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
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
