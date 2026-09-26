import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './components/App'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './contexts/ToastContext'
import { QuotesProvider } from './contexts/QuotesContext'

// The full provider tree. Shared by the browser entry (main.jsx) and the
// build-time prerender (prerender.jsx), so the prerendered landing markup is
// exactly what the first client render produces.
export default function Root({ queryClient }) {
  return (
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
    </React.StrictMode>
  )
}
