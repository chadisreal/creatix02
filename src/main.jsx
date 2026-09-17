import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { SiteMotion } from './site-motion.jsx'
import App from './App.jsx'
import './tailwind.css'
import './styles.css'
import './combined.css'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <SiteMotion>
      <App />
    </SiteMotion>
  </StrictMode>
)

// Built pages arrive prerendered (scripts/prerender.mjs); the dev server sends an empty shell.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
