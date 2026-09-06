/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'
import { FAQ_ITEMS } from './src/data/faq.js'

// Renders index.html's FAQPage JSON-LD from the same FAQ_ITEMS array that
// InputPhase.jsx uses for the visible FAQ section, so the two can't drift.
// Runs in both dev and build (transformIndexHtml applies to the dev server's
// served HTML too), replacing the <!--FAQ_JSONLD--> placeholder.
function injectFaqJsonLd() {
  return {
    name: 'inject-faq-jsonld',
    transformIndexHtml(html) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }
      return html.replace('<!--FAQ_JSONLD-->', JSON.stringify(jsonLd, null, 2))
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    injectFaqJsonLd(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // These chunks are intentionally lazy-loaded (localQuotes ~477KB, compromise
        // NLP ~354KB, and the results-phase bundle). Precaching them would re-download
        // ~1.1MB on every service-worker install/deploy and undo the lazy-load benefit.
        // The runtimeCaching entry below still caches them (CacheFirst) after first use,
        // so returning/offline users keep them.
        globIgnores: ['**/localQuotes-*.js', '**/nlp-*.js', '**/ResultsPhase-*.js'],
        runtimeCaching: [
          {
            // Same-origin app chunks — cache on first use so offline still works
            // without bloating the precache manifest. Hashed filenames make CacheFirst safe.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/assets\/.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-lazy-chunks',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fontshare serves Satoshi — the primary UI font. Without these entries
          // offline PWA sessions fall back to the system font.
          {
            urlPattern: /^https:\/\/api\.fontshare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontshare-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.fontshare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontshare-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Commonplace',
        short_name: 'Commonplace',
        description: 'Organize your quote collection with AI',
        theme_color: '#FAF8F4',
        background_color: '#FAF8F4',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/motion/')) return 'motion';
          if (id.includes('node_modules/@dnd-kit/')) return 'dndkit';
          if (id.includes('node_modules/@base-ui/')) return 'baseui';
          if (id.includes('node_modules/compromise/')) return 'nlp';
        },
      },
    },
  },
  test: {
    globals: true,
  }
})
