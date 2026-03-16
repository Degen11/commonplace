import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './components/App'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './contexts/ToastContext'
import { QuotesProvider } from './contexts/QuotesContext'
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

// Apply theme immediately to prevent flash of wrong theme
try {
  const saved = localStorage.getItem("commonplace_theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else if (saved === "light") {
    // Explicit light choice — add "light" class so CSS media-query dark fallback is overridden
    document.documentElement.classList.add("light");
  }
  // When no saved preference, the CSS @media(prefers-color-scheme:dark) handles it automatically
} catch {}

// Inject global CSS once at app root (was previously injected 3x via <style> tags)
const style = document.createElement('style')
style.textContent = baseCSS
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <QuotesProvider>
            <App />
          </QuotesProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// Pre-warm the local quotes database during idle time so the first
// processing run doesn't stall on the ~477KB dynamic import.
const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
scheduleIdle(() => { import('./data/localQuotes').catch(() => {}) })