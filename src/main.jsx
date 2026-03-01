import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import { baseCSS } from './components/styles'

// Inject global CSS once at app root (was previously injected 3x via <style> tags)
const style = document.createElement('style')
style.textContent = baseCSS
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)