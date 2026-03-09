import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const MANUAL_CHUNK_GROUPS = {
  react: new Set(['react', 'react-dom', 'react-router-dom']),
  muiCore: new Set(['@mui/material', '@mui/system', '@mui/utils', '@emotion/react', '@emotion/styled', '@popperjs/core']),
  muiIcons: new Set(['@mui/icons-material']),
  antd: new Set(['antd', '@ant-design/icons', '@radix-ui/react-dialog', '@radix-ui/react-tooltip']),
  charts: new Set(['chart.js', 'react-chartjs-2', 'recharts', 'd3-delaunay']),
  tiptap: new Set([
    '@tiptap/react',
    '@tiptap/starter-kit',
    '@tiptap/pm',
    '@tiptap/extension-image',
    '@tiptap/extension-link',
    '@tiptap/extension-underline',
    'marked',
    'dompurify'
  ]),
  jspdfCore: new Set(['jspdf']),
  jspdfPlugins: new Set(['jspdf-autotable']),
  htmlCapture: new Set(['html2canvas']),
  reactPdfRenderer: new Set(['@react-pdf/renderer', '@react-pdf/reconciler']),
  reactPdfEngine: new Set([
    '@react-pdf/font',
    '@react-pdf/fns',
    '@react-pdf/image',
    '@react-pdf/layout',
    '@react-pdf/pdfkit',
    '@react-pdf/png-js',
    '@react-pdf/primitives',
    '@react-pdf/render',
    '@react-pdf/stylesheet',
    '@react-pdf/textkit'
  ]),
  reactPdfFonts: new Set(['fontkit', 'restructure']),
  reactPdfVendor: new Set(['yoga-layout', 'unicode-properties', 'unicode-trie', 'linebreak', 'emoji-regex']),
  threeCore: new Set(['three']),
  threeReact: new Set(['@react-three/fiber', '@react-three/drei', '@react-spring/three']),
  audio: new Set(['tone']),
  supabase: new Set(['@supabase/supabase-js'])
};

const getPackageName = (id: string) => {
  const nodeModulesPath = id.split('/node_modules/')[1];

  if (!nodeModulesPath) {
    return null;
  }

  const parts = nodeModulesPath.split('/');

  return parts[0].startsWith('@')
    ? `${parts[0]}/${parts[1]}`
    : parts[0];
};

const resolveManualChunk = (id: string) => {
  if (id.includes('/src/pages/Story/components/StoryPDF.tsx') || id.includes('/src/pages/Story/components/WordGamesPDF.tsx')) {
    return 'story-pdf-documents';
  }

  const packageName = getPackageName(id);

  if (!packageName) {
    return undefined;
  }

  if (MANUAL_CHUNK_GROUPS.react.has(packageName)) return 'react-vendor';
  if (MANUAL_CHUNK_GROUPS.muiCore.has(packageName)) return 'mui-core';
  if (MANUAL_CHUNK_GROUPS.muiIcons.has(packageName)) return 'mui-icons';
  if (MANUAL_CHUNK_GROUPS.antd.has(packageName)) return 'antd-vendor';
  if (MANUAL_CHUNK_GROUPS.charts.has(packageName)) return 'charts-vendor';
  if (MANUAL_CHUNK_GROUPS.tiptap.has(packageName)) return 'editor-vendor';
  if (MANUAL_CHUNK_GROUPS.jspdfCore.has(packageName)) return 'jspdf-core';
  if (MANUAL_CHUNK_GROUPS.jspdfPlugins.has(packageName)) return 'jspdf-plugins';
  if (MANUAL_CHUNK_GROUPS.htmlCapture.has(packageName)) return 'html-capture';
  if (MANUAL_CHUNK_GROUPS.reactPdfRenderer.has(packageName)) return 'react-pdf-renderer';
  if (MANUAL_CHUNK_GROUPS.reactPdfEngine.has(packageName)) return 'react-pdf-engine';
  if (MANUAL_CHUNK_GROUPS.reactPdfFonts.has(packageName)) return 'react-pdf-fonts';
  if (MANUAL_CHUNK_GROUPS.reactPdfVendor.has(packageName)) return 'react-pdf-vendor';
  if (MANUAL_CHUNK_GROUPS.threeCore.has(packageName)) return 'three-core';
  if (MANUAL_CHUNK_GROUPS.threeReact.has(packageName)) return 'three-react';
  if (MANUAL_CHUNK_GROUPS.audio.has(packageName)) return 'audio-vendor';
  if (MANUAL_CHUNK_GROUPS.supabase.has(packageName)) return 'supabase-vendor';

  return undefined;
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'images/beyninikullan.webp'],
      manifest: {
        name: 'BilsemC2 - Beynini Kullan',
        short_name: 'BilsemC2',
        description: 'BİLSEM sınavına hazırlık ve bilişsel gelişim platformu. Yapay zeka destekli eğitsel oyunlar.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['education', 'games'],
        lang: 'tr',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // globPatterns default olarak bırakıldı (dev modda uyarı vermemesi için)
        // manuel olarak ihtiyaç olursa eklenebilir
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        importScripts: ['/sw-push.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
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
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.elevenlabs.io https://evmos-evm.publicnode.com/ https://*.google.com https://*.googleapis.com https://fonts.gstatic.com https://tonejs.github.io https://*.googlesyndication.com https://*.adtrafficquality.google/ https://*.doubleclick.net https://*.openai.com https://www.google-analytics.com https://region1.google-analytics.com https://*.googletagmanager.com data:;",
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
  assetsInclude: ['**/*.webp', '**/*.svg'],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ]
  },
  build: {
    assetsDir: 'assets',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk,
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
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
