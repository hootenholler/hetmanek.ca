# hetmanek.ca

- `design/` reference exports from Claude Design (not deployed)
- `src/` the production site (this is what gets deployed)
- `cms/` the local content editor (never deployed)

## How it's built

Plain HTML, CSS and vanilla JS. There's no build step.

- `src/js/content.js` holds all published content: Work, Build Log posts, Case Studies, Letters. Edit it with the local CMS (below) or by hand. It's plain JSON with Markdown bodies, and dates are `YYYY-MM-DD`.
- `cms/drafts.json` holds drafts. It stays on your machine: git ignores it, so drafts are never committed, pushed or deployed. That also means drafts aren't backed up until you publish them.
- Home (`/`) and the Build Log (`/buildlog/`) are built in the browser from `content.js`.
- Work, Case Study and Letter pages are finished HTML files that the CMS writes from `content.js`: `/work/project-name` is `src/work/project-name.html`. Don't edit these files by hand. If you edit `content.js` by hand, start the CMS once and it rewrites them.
- `src/css/styles.css` holds the design tokens and every style. Layouts are mobile first and switch to desktop at 900px.
- Fonts are self-hosted in `src/assets/fonts` (from Google Fonts, with their licences).

## Run locally

Use `npx wrangler dev`, which serves `/work/<id>` from `src/work/<id>.html` the same way Cloudflare does. Then open http://localhost:8787.

## Local CMS

Start it by double-clicking `start-cms.command` in Finder, or by running `npm run cms`. It opens http://127.0.0.1:4321, which is your site with an editing bar on top. You need Node.js, and nothing else to install.

- **Add new content** (top bar): pick Work, Build Log post, Case Study or Letter, then fill in the form.
- **Edit this page** (top bar on entry pages), or **Edit post** beside each Build Log post.
- **Save draft & preview** saves the entry to `cms/drafts.json` and shows it with a Draft label. Drafts appear only in the CMS, never on the public site.
- **Publish** moves the entry into `content.js` and writes its page.
- **Insert image** and **Upload image** copy pictures into `src/assets/<type>/<id>/` with web-safe names.

Bodies use Markdown: `## Heading`, `**bold**`, `*italic*`, `[link](https://…)`, `> quote`, `- list`, `![alt](/assets/…)`. A YouTube link on its own line becomes an embedded video.

Nothing goes live until you commit and push. In GitHub Desktop, make a branch, commit the changed files (`src/js/content.js`, the pages in `src/work`, `src/casestudies` and `src/letters` and any new images), push, open a PR, and merge into `main`. Cloudflare then deploys it. To undo unsaved experiments, discard the changes in GitHub Desktop.

Stop the CMS by closing its Terminal window or pressing Ctrl+C.
