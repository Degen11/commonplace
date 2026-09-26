import { renderToString } from 'react-dom/server'
import { QueryClient } from '@tanstack/react-query'
import Root from './Root'
import { baseCSS } from './components/styles'

// Build-time only (scripts/prerender.mjs): renders the landing page as a
// first-time visitor sees it, so index.html ships real markup instead of an
// empty #root.
export function render() {
  return { html: renderToString(<Root queryClient={new QueryClient()} />), css: baseCSS }
}
