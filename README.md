# hetmanek.ca

- `design/` reference exports from Claude Design (not deployed)
- `src/` the production site (this is what gets deployed)
- `cms/` the local content editor (never deployed)

## How it's built

Plain HTML, CSS and vanilla JS. There's no build step.

- `src/js/content.js` holds all content: Work, Build Log posts, Case Studies, Letters. Edit it with the local CMS (below) or by hand. It's plain JSON with Markdown bodies. Dates are `YYYY-MM-DD`, and `"draft": true` hides an entry on the public site.
- Each page type has one template: `/` (Home), `/buildlog/`, `/work/`, `/casestudies/`, `/letters/`. Entry URLs like `/work/pengi-by-beatrix` are served by their template through `src/_redirects`.
- `src/css/styles.css` holds the design tokens and every style. Layouts are mobile first and switch to desktop at 900px.

## Run locally

Use `npx wrangler dev`, which applies `_redirects` the same way Cloudflare does. Then open http://localhost:8787.

## Local CMS

Start it by double-clicking `start-cms.command` in Finder, or by running `npm run cms`. It opens http://127.0.0.1:4321, which is your site with an editing bar on top. You need Node.js, and nothing else to install.

- **Add new content** (top bar): pick Work, Build Log post, Case Study or Letter, then fill in the form.
- **Edit this page** (top bar on entry pages), or **Edit post** beside each Build Log post.
- **Save draft & preview** saves the entry and shows it with a Draft label. Drafts appear only in the CMS, never on the public site.
- **Publish** removes the draft flag.
- **Insert image** and **Upload image** copy pictures into `src/assets/<type>/<id>/` with web-safe names.

Bodies use Markdown: `## Heading`, `**bold**`, `*italic*`, `[link](https://…)`, `> quote`, `- list`, `![alt](/assets/…)`. A YouTube link on its own line becomes an embedded video.

Nothing goes live until you commit and push. In GitHub Desktop, make a branch, commit the changed files (`src/js/content.js` and any new images), push, open a PR, and merge into `main`. Cloudflare then deploys it. To undo unsaved experiments, discard the changes in GitHub Desktop.

Stop the CMS by closing its Terminal window or pressing Ctrl+C.
