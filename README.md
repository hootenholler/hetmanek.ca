# hetmanek.ca

- `design/` reference exports from Claude Design (not deployed)
- `src/` the production site (this is what gets deployed)

## How it's built

Plain HTML, CSS and vanilla JS. There's no build step.

- `src/js/content.js` holds all content: Work, Build Log posts, Case Studies, Letters. Edit this file to add or change entries. Use ISO dates (`2026-10-19`). Set `draft: true` to hide an entry.
- Each page type has one template: `/` (Home), `/buildlog/`, `/work/`, `/casestudies/`, `/letters/`. Entry URLs like `/work/pengi-by-beatrix` are served by their template through `src/_redirects`.
- `src/css/styles.css` holds the design tokens and every style. Layouts are mobile first and switch to desktop at 900px.

## Run locally

Use `npx wrangler dev`, which applies `_redirects` the same way Cloudflare does. Then open http://localhost:8787.
