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
