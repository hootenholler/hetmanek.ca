# Project rules for Claude

## Project
hetmanek.ca website (personal portfolio for James Hetmanek). Design reference lives in /design; read design/hetmanek-site-handoff/README.md first.

## Stack
Static site: plain HTML, CSS and vanilla JS. No build step.

## Rules
- Production files live in /src only. Never edit /design.
- Match the design at desktop and mobile widths.
- Mobile-first, semantic HTML, accessible (alt text, contrast, keyboard nav).
- Image and file names: lowercase, hyphens, no spaces.
- Never commit secrets, keys or .env files.
- Work on feature branches; open PRs into main.

## Dev0

Dev0 defines simplicity as fewer parts, kept separate, each legible. Start from zero: every addition (a dependency, tool, layer, abstraction, file or line of configuration) must earn its place against the whole system. "Why not add this?" is the wrong question; "does this earn the right to exist?" is the right one.

### Roles

- James is the architect and owns the design and the responsibility for it. Claude is the doer: build what the design (/design) and the task ask for, faithfully, and nothing more.
- When the design or the task does not answer a question, stop and ask. Do not improvise, and do not quietly improve on the design.
- Any rule here can be broken, but only by the architect, in writing. If a rule seems wrong for the case in front of you, raise it as a question.

### The six tests

Anything you add must pass all six. One failure is a no, unless the architect writes an exception.

1. Less: does it reduce what can go wrong? Count transitive dependencies, configuration and infrastructure, not just lines of code. An npm package for the CMS, a CSS framework or a static-site generator brings its whole tree with it.
2. Separate: does each part do one thing, in its own place, behind a clear interface? Never interleave languages, or client and server code, in one block. Markup in HTML, styles in src/css, behaviour in src/js; no inline `<style>`, `<script>` or style attributes. Content lives in src/js/content.js, not in page markup. The CMS (cms/) never ships, and site code in src/ never depends on it.
3. Legibility: can a reader predict what it does without running it? Fewer parts never justifies clever or illegible ones.
4. Native: does the language, runtime or platform already do this? Use the built-in first: HTML elements such as `<dialog>`, `<details>` and form validation before scripted widgets; modern CSS (custom properties, nesting, grid, container queries) before JS layout; `fetch`, `URL` and `Intl` in the browser; `node:http`, `node:fs` and `node:path` in the CMS. A polyfill for a standard is acceptable; a second API for the same job is not.
5. Beneficiary: does it serve the end user, or only the developer? When they conflict, the user wins. Page weight, load speed, contrast and keyboard access beat authoring convenience.
6. Control: do we control where it runs? Use current features where we own the runtime: the local Node CMS and Cloudflare (wrangler.jsonc). Be conservative in the visitor's browser, which we do not control.

### In practice

- Add no dependency, runtime or development, without the architect's decision. package.json has no dependencies; keep it that way unless James decides otherwise.
- Write the direct version first. Abstract on the third repetition, not the second.
- Validate input at the system boundary, then trust it. In the CMS, that boundary is the HTTP request in cms/server.mjs (paths, uploads, content writes). No defensive checks on arguments that cannot be wrong.
- Let errors propagate to one boundary handler. Catch only to add information, convert the error into a response, or release a resource.
- A function lives in the file that calls it until a second caller exists. No shared helpers folder for one function.
- No wrapper that only forwards to another function.
- Tools may check code freely: types, lint, format. They may transform it only on the way out, such as minifying. Do not put a compile step between the source and what runs without an exception: src/ is served as written.
- Comments carry what the code cannot: why, intent, edge cases and the alternative rejected.
- When you make or propose a decision, record the alternatives you rejected. The code can never show what was ruled out.
