# Creatix Innovation — combined website

The merged site lives in this React/Vite project. Run `npm run dev` for the local preview and `npm run build` for production output in `dist`.

The editorial version contributes its glass sculpture artwork, typography direction, discipline cards, interactive concept gallery, process narrative, glass feature section, downloadable project brief, and motion preference. The original React version contributes its hero controls, animated photography, full 14-service catalogue and service details (now one page per service), results, team, testimonials, timeline, and contact/WhatsApp flows.

The brief is generated in the visitor’s browser. Download and copy do not send it anywhere. Sharing on WhatsApp opens a draft for the visitor to send. The existing demo inquiry works the same way; there is no new form backend.

Original versions are preserved in `../references/original-react` and `../references/original-editorial`. The React snapshot contains the original source and HTML; its unchanged image library and dependencies remain in this project. The editorial snapshot includes the full original static site. The external source folder was not modified.

Run `node scripts/check-site.mjs` for page rendering, internal link, image, service coverage, unique title/description and section checks. This is not a browser interaction or visual test.

## Pages and SEO

The site is one long page with real addresses for its sections. Nothing reloads and nothing swaps out while you browse.

| Address | What happens |
| --- | --- |
| `/` | The one page: hero, studio, services, possibilities, process, results, team, testimonials, FAQ, brief, contact |
| `/about`, `/services`, `/portfolio`, `/contact` | The same page, opened at Studio, Expertise, Work or Contact. Nav links glide there, and the address follows as you scroll. |
| `/<service-slug>` | Clicking a service opens it as a sheet over the page, at its own address (e.g. `/crm-solutions`). Opening that address directly, as a visitor from Google does, shows the service's full page. Slugs live in `src/content.js`. |

- `src/routes.js` holds every address's title, description and section, the structured data (organisation, FAQ, services, breadcrumbs) and the site address (`SITE.url`).
- The section addresses share the home page's content, so their canonical link points to `/` and only `/` and the 14 service pages go in the sitemap. The service pages are the ones that can rank for specific searches.
- `src/router.jsx` handles the gliding, the address following the scroll, Back/Forward, and the service sheets. `src/pages.jsx` builds the one page, the service pages and 404 from `src/sections.jsx` and `src/StudioSections.jsx`.
- `npm run build` builds the app, then `scripts/prerender.mjs` writes fully rendered HTML for every address (`dist/about.html` and so on), `404.html`, `sitemap.xml` and `robots.txt`. Section addresses open at their section before the script loads.
- `vercel.json` serves `about.html` at `/about` (`cleanUrls`) and sends the old `/team` and `/experience` addresses to `/about` with a permanent redirect.
- To add a service page: add the service to `SERVICES` in `src/content.js`. It gets an address, a prerendered page, a sheet and a sitemap entry automatically.
- `public/img/og-image.jpg` is the 1200×630 preview shown when a link is shared.

## Hero shader rings

The hero is one steady message over an animation of expanding digital line rings. The rings component lives at `src/components/ui/shader-lines.tsx` (exported as `ShaderAnimation`); `src/components/ui/demo.tsx` is an isolated preview. The earlier neural vortex background is kept in `../references/neural-vortex-hero`.

It is adapted from a Three.js shader snippet. The shader is the same idea: mosaic cells, per-column time jitter and a three-channel fringe. It is written in plain WebGL, because loading three.js r89 from a CDN for one full-screen quad added a large third-party script, and that snippet uses APIs newer three.js has removed. Changes to fit the site:

- Colours come from CSS (lilac, a violet lead and a warm trailing edge that echoes the ring logo) instead of raw RGB.
- Two calm bands fade in and out rather than popping when they wrap. Speed is based on time, so 120Hz phones don't run it twice as fast.
- On a mouse, the rings lean slightly toward the pointer. On desktop they sit right of the copy; on tablet and phone they sit above it.

Placement and look are CSS custom properties on the canvas (`--rings-x`, `--rings-y`, `--rings-size`, `--rings-cell`, `--rings-line`, `--rings-color`, `--rings-lead`, `--rings-trail`), set per breakpoint in `src/combined.css` under `.hero-rings`.

Props: `paused?: boolean` holds a still frame; `className?: string`.

Cost: it starts only after the page has loaded and the browser is idle, so it never delays the first paint. It draws at most 30 frames a second (the rings snap to cells, so more changes nothing), within a pixel budget that is lower on phones. It lowers its own resolution if a device can't keep up, and stops when off-screen, when the tab is hidden, when paused (the hero's pause button) and with reduced motion. It recovers from a lost WebGL context. Without WebGL, the hero card's CSS glow stands in.

The hero's glass pills are tinted rather than blurred, since blurring over a moving canvas redraws the blur every frame. Host Grotesk is self-hosted from `public/fonts` (SIL Open Font License, `public/fonts/OFL.txt`), so no Google Fonts request blocks the first paint.

### Project structure and setup

This was a JavaScript React/Vite project with flat components in `src/`. It now supports TypeScript incrementally (`allowJs`, existing JavaScript retained), Tailwind v4, the `@/` source alias, and a shadcn-compatible `components.json` with a shared `cn` utility.

- Reusable UI: `src/components/ui/`, imported as `@/components/ui/...`. This is the requested `components/ui` convention under the project's source root. Keeping a dedicated folder gives shadcn CLI additions a predictable home and separates reusable UI from page sections.
- Existing global styles: `src/styles.css` and `src/combined.css` (the latter contains the active design overrides).
- Tailwind entry and shadcn theme mappings: `src/tailwind.css`.
- Scoped ring styling and defaults: `src/components/ui/shader-lines.css`.

Setup is already applied. To reproduce the dependency setup in a fresh copy:
```sh
npm install clsx tailwind-merge
npm install -D typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite
```

Keep the included Vite alias/plugin configuration, `tsconfig.json`, `components.json`, and Tailwind entry import. For a separate unconfigured Vite project, `npx shadcn@latest init` initializes shadcn; this project already has the configuration, so use `npx shadcn@latest add button` (or another desired component) for future additions and review the generated styling.

Tailwind Preflight is omitted to preserve the existing reset, following [Tailwind's existing-project guidance](https://tailwindcss.com/docs/preflight#disabling-preflight). UI paths follow the [shadcn alias configuration](https://ui.shadcn.com/docs/components-json). See the [shadcn CLI documentation](https://ui.shadcn.com/docs/cli) for initialization and component additions.

### Verification

```sh
npm run typecheck
npm run build
node scripts/check-site.mjs
node scripts/check-pages.mjs
node scripts/check-hero.mjs
```

`check-hero.mjs` uses installed Chrome through Playwright and the Vite dev server on port 5193. It checks that the ring canvas fits the hero card, shaders compile, the rings animate and lean toward the pointer, pause/play works, rendering stops off-screen and with reduced motion, a lost WebGL context recovers, the no-WebGL fallback stays readable, and the phone layout (copy at the bottom, calls to action on screen) and menu work. Desktop and mobile screenshots are saved in `artifacts/`. `check-pages.mjs` serves the built `dist` folder and loads every address on desktop and mobile (status, clean URL, title, canonical, one h1, lands on its section, no sideways scroll, no hydration errors), then checks the one-page gliding, the address following the scroll, Back, service sheets, service landing pages, the results rail, old URLs and the 404 page.
