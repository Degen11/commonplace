import ReactDOM from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import Root from './Root'
import { baseCSS } from './components/styles'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// The saved theme class is applied before first paint by public/boot.js.

// Global CSS. Production builds already inline it in <head> (id="cp-base-css",
// written by scripts/prerender.mjs) so the prerendered markup is styled before
// any JS runs; the dev server has no prerender, so inject it here.
if (!document.getElementById('cp-base-css')) {
  const style = document.createElement('style')
  style.id = 'cp-base-css'
  style.textContent = baseCSS
  document.head.appendChild(style)
}

// Catch unhandled promise rejections (e.g. failed fetches, async errors)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') return;
  console.error('[Commonplace] Unhandled rejection:', event.reason);
})

// createRoot (not hydrateRoot): #root may hold the prerendered landing page,
// but returning visitors, shared links and saved drafts all render something
// else first, so React replaces that markup in its first commit rather than
// trying to hydrate it. For a first-time visitor the replacement is the same
// layout, so nothing shifts.
ReactDOM.createRoot(document.getElementById('root')).render(<Root queryClient={queryClient} />)

// Pre-warm the heavy lazy chunks during idle time so the first processing run
// doesn't stall on the ~477KB local-quotes DB or the ~354KB compromise NLP import.
const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
scheduleIdle(() => { import('./data/localQuotes').catch(() => {}) })
scheduleIdle(() => { import('./utils/smartRestore').then(m => m.initNlp()).catch(() => {}) })