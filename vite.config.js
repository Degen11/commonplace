/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
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

// Emits dist/sitemap.xml with each page's <lastmod> taken from the last git
// commit touching the files that make up that page, so the dates can't go
// stale the way hand-edited ones did. If git can't say (no .git, or a shallow
// clone whose history stops before the page's last change), <lastmod> is left
// out rather than guessed.
const SITE_URL = 'https://commonplace.pro'
const SITEMAP_PAGES = [
  { loc: SITE_URL, files: ['index.html', 'src/components/InputPhase.jsx', 'src/components/inputPhaseStyles.js', 'src/data/faq.js'] },
  { loc: `${SITE_URL}/privacy`, files: ['public/privacy.html'] },
  { loc: `${SITE_URL}/terms`, files: ['public/terms.html'] },
]

function gitLastModified(files) {
  try {
    const [hash, date] = execFileSync('git', ['log', '-1', '--format=%H %cs', '--', ...files], { encoding: 'utf8' }).trim().split(' ')
    if (!hash) return null
    // In a shallow clone the boundary commit "touches" every file, so a hit on
    // it says nothing about when the file really changed.
    const shallowFile = execFileSync('git', ['rev-parse', '--git-path', 'shallow'], { encoding: 'utf8' }).trim()
    if (existsSync(shallowFile) && readFileSync(shallowFile, 'utf8').includes(hash)) return null
    return date
  } catch {
    return null
  }
}

function generateSitemap() {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    generateBundle() {
      const urls = SITEMAP_PAGES.map(({ loc, files }) => {
        const lastmod = gitLastModified(files)
        return `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    injectFaqJsonLd(),
    generateSitemap(),
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
        // Only the app's own URLs get the precached shell (the landing page and
        // /c/:id share links). Without this, Workbox's default fallback answered
        // every navigation, so returning visitors saw the app at /privacy,
        // /terms and at would-be 404s.
        navigateFallbackAllowlist: [/^\/$/, /^\/c\/[a-z0-9]+\/?$/],
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
          // Fonts (Satoshi, Playfair Display) are self-hosted under /fonts/ now —
          // no third-party origin to runtime-cache. The .woff2 files are same-origin
          // and match globPatterns, so they're precached like any other static asset.
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
        // Named vendor chunks. Each group also captures its dependencies, and
        // the higher-priority group claims a shared module first, so React
        // (priority 20) gets its own chunk. With the old manualChunks setup, the
        // 'baseui' group captured React as a dependency, and since the landing
        // page needs React, all of Base UI came along on its critical path.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-is|scheduler|use-sync-external-store)[\\/]/, priority: 20 },
            { name: 'motion', test: /node_modules[\\/]motion[\\/]/, priority: 10 },
            { name: 'dndkit', test: /node_modules[\\/]@dnd-kit[\\/]/, priority: 10 },
            { name: 'baseui', test: /node_modules[\\/]@base-ui[\\/]/, priority: 10 },
            { name: 'nlp', test: /node_modules[\\/]compromise[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
  }
})
