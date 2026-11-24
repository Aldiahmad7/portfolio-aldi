import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '../styles/global.css'
import { App } from './App'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Production HTML is prerendered (scripts/prerender.ts); the dev server serves an empty root.
if (container.firstElementChild) hydrateRoot(container, app)
else createRoot(container).render(app)
