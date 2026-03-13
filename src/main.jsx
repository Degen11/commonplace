import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './contexts/ToastContext'
import { QuotesProvider } from './contexts/QuotesContext'
import { baseCSS } from './components/styles'

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
      <ToastProvider>
        <QuotesProvider>
          <App />
        </QuotesProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)