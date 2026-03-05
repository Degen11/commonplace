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
  if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
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