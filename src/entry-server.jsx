// Used at build time only: renders a page to HTML for scripts/prerender.mjs.
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { SiteMotion } from './site-motion.jsx'
import App from './App.jsx'

export { NOT_FOUND, PAGES, SITE, headTags, pageUrl } from './routes.js'

export const render = url => renderToString(
  <StrictMode>
    <SiteMotion>
      <App url={url} />
    </SiteMotion>
  </StrictMode>
)
