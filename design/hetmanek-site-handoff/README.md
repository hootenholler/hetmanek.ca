# hetmanek.ca — design handoff for Claude Code

Personal portfolio for James Hetmanek. This bundle holds the finished page designs (desktop 1440 and mobile 390), design tokens, and the behaviours that need to be built. Read this file first, then open the sources in `design-source/`.

**Companion spec:** the *Site Content Model* tab of the Google Doc "https://docs.google.com/document/d/1rkD5E8GYM5xwZsU7Fu5gJtAbyKt7tmdv2FtTPto647o" defines the four collections (Work, Build Log, Case Studies, Letters & Articles), shared vocabularies, derived fields and URL rules. Where this README and the doc disagree, ask James. The stack is **undecided** (Astro vs a zero-dependency Dev0 build — see the doc's Appendix); these designs do not depend on either.

## What's in the bundle

| Path | What it is |
|---|---|
| `design-source/*.dc.html` | One file per artboard. Plain HTML with **inline styles**, plus a small `<script>` per interactive page. `{{holes}}`, `<sc-if>`, `<sc-for>` and `onClick` are a design-canvas templating layer — treat them as pseudo-templates, not production syntax. Open them as the visual source of truth. |
| `design-source/canvas.json` | Board list and page grouping (which file is which page). |
| `design-tokens.css` | Colours, fonts, spacing as CSS variables. |
| `assets/portrait.jpg` | Headshot (3:2). Sources reference it as `/_blob/390826933cc156b05eac52208585e685`. |

Images elsewhere are striped **placeholders** (labelled "IMAGE"). All body copy is lorem ipsum except the Home excerpts and the Work table.

## Pages and routes

| Route | Desktop source | Mobile source |
|---|---|---|
| `/` Home | `Home-v3.dc.html` | `Home-mobile.dc.html` |
| `/buildlog` and `/buildlog#<id>` | `Build-Log.dc.html` | `Build-Log-mobile.dc.html` |
| `/work/<id>` | `Work.dc.html` | `Work-mobile.dc.html` |
| `/casestudies/<id>` | `Case-Study.dc.html` | `Case-Study-mobile.dc.html` |
| `/letters/<id>` | `Letters.dc.html` | `Letters-mobile.dc.html` |
| (sitemap diagram) | `Main.dc.html` | — |

Each template is designed once and reused for every entry (the design shows one sample entry per template: Pengi by Beatrix, Hidden Complexity, "Notes on building in public"). Responsive switch is at **900px**; ship one responsive site, not two. In sources, links point at the other `.dc.html` files — replace with the real routes above.

## Global rules

- Background `--bg`; container max 1200px, 32px side padding (20px on mobile).
- Header on every inner page (Work, Case Study, Letters, mobile Build Log): "James Hetmanek" (serif 28px desktop / 30px mobile, links Home) with `LISTEN - LEARN - DESIGN - BUILD` (Barlow Condensed, forest green) beside it, and a `← Home` outlined pill button on the right.
- Skills appear everywhere as outlined white pills. Hashtags (Build Log) are forest-green text: engagement titles first, then skills, CamelCased (`#PengiByBeatrix`, `#DesignResearch`).
- Dates: display formats are a layout concern; store ISO dates. Build Log long form "October 19th, 2026"; Home excerpts "October 19, 2026"; tables "19-Oct-2026" / "Oct 19, 2026".
- Fonts via Google Fonts: Instrument Serif (+italic), Instrument Sans 400/500/600 (+italic 400), JetBrains Mono 400/500, Barlow Condensed 400. No weight lighter than 400 is available for the Instrument families.
- Hover: links turn `--accent`. Focus styles are not designed yet — add visible focus rings.
- Touch targets: desktop pills are 35px tall by design choice; mobile uses ≥44px.

## Home (`/`)

Top section: left column (≈25% of width, min 240px) holds the name row (serif, sized `9cqw` of the figure width, LinkedIn icon link beside it), the portrait (3:2), and the tagline (66.7% of image width, justified single line, `4.5cqw`). Container query units keep name and tagline proportional to the image. Right column starts 38px down so the first excerpt aligns with the image top. Two excerpts, each clamped to **3 lines** (`max-height: 1.6em × 3`):
1. Pinned post: `PINNED` (forest, bold) + `— <date>` + text, ending with a blue italic `read more →` four spaces after the last full stop.
2. Newest unpinned post, ending with a fade and `… read more →`.
Both link to `/buildlog#<id>`.

Below: tabs **Work · Case Studies · Build Log · Letters & Articles**, then a **Filter** button (see Filters) and a table per tab:

| Tab | Columns | Row link |
|---|---|---|
| Work | Engagement, Description, Skills, Last Update, Status | engagement → `/work/<id>` |
| Case Studies | Opportunity, Engagement, Skills | opportunity → `/casestudies/<id>` |
| Build Log | Date, Excerpt + `read more →`, Engagement, Skills | date and read more → `/buildlog#<id>` |
| Letters & Articles | Title, Summary, Skills, Date | title → `/letters/<id>` |

Mobile: tabs scroll horizontally; each table row becomes a card (title, status or summary, skills, date).

Work table data is real — see the arrays at the bottom of `Home-v3.dc.html` (`ITEMS`). Last Update is derived (later of `updated` and newest Build Log post referencing the engagement). Status values currently in use: Alive, Active, In Dev, In Design, Done. The Type filter was removed; the content model still has `type` on Work (open decision: whether to show it).

## Filters (Home and Build Log)

- Button: closed = Home near-black pill / Build Log earth-brown pill (`--earth`), icon is three decreasing lines. **Open state** = tint fill, 2px earth border, earth bold text, soft glow, icon flipped (increasing lines). Click again to close.
- Panel: forest-green box (`--forest`) directly under the button, group labels in `--forest-label`, options as pills (white unselected, near-black selected, 40–44px tall).
- Home: Skills always; Status only on the Work tab. Build Log: Skills and Engagements. Filter options list only values that exist in the corpus. Within a group selections are OR; across groups AND.
- Home shows `Filter (n)` and a "Clear filters" link when active. Build Log shows selected values as dark removable chips under the button **only when the panel is closed**; when open, selections show inside the panel.

## Build Log (`/buildlog`)

Desktop: left column sticky (position sticky, top 48px, ≥900px only) holding "James Hetmanek / Build Log", the portrait, tagline, then Home + Filter buttons (centred, 35px). Right column: posts newest-first, max-width 640px, 56px apart, first post aligned with the image top (38px offset). Each post: date as a bold link to its own anchor (tooltip `www.hetmanek.ca/buildlog#<id>`), 1+ paragraphs, hashtags.
Behaviour:
- Shows **3 posts at a time**; loads 3 more only when the reader scrolls within 240px of the bottom.
- `#<id>` deep link loads far enough to include the post, clears filters if they hide it, then scrolls to it.
- Empty state: "No posts match these filters."
Mobile: uses the standard inner header, then a Filter button, then single-column posts (no portrait).

## Work entry (`/work/<id>`)

Two columns: title (serif 72px), one-line description, body, 3-image gallery at the bottom of the left column; right column has a metadata table (Type, Status, Last Update, Skills), then **BUILD LOG** (posts referencing this engagement, linked to anchors), then **CASE STUDIES**. Mobile stacks: title, description, metadata, body, gallery, build log, case studies. Hero image intentionally removed.

## Case Study (`/casestudies/<id>`)

Single centred column (max 800px). Title; under it "**Case Study from** <linked Work title>" (when no linked engagement: just "Case Study"); skills pills; four sections **Opportunity · Solution · Wins · Learning** with the label in the left gutter (above the text on mobile). A gallery-size image sits right-aligned under Opportunity and Wins. Headings are a writing template only — do not parse them.

## Letters & Articles (`/letters/<id>`)

Single centred column (max 680px): mono date, serif title, summary line, 3:2 image, body (supports pull quote and subheadings), skills pills. Fields provisional — see content model.

## Content model hooks (from the doc)

Work: title, type, status, description, skills, updated, derived lastUpdate. Build Log: date, engagements[], skills[], pinned (max one), excerpt (else first paragraph ≈120 chars), body, derived id (`YYYY-MM-DD`, suffix for same-day posts) and hashtags. Case Study: title, engagement, skills, order, body. Letter: title, date, summary, skills, order, body. Everything supports `draft: true`. Media: images stored beside the post; **YouTube embeds wanted** (not designed yet). Filter state in the URL is deferred past launch.

## Not designed / decisions for James

- Real LinkedIn URL (Home icon links to `#`), real portrait crops, real copy and images.
- YouTube embed styling, focus states, 404, empty-tab states beyond the text shown.
- Whether Work rows without a body should link anywhere (doc default: link only when a body exists; James chose "each row links to its own page").
- The stack (Astro vs Dev0) and where content lives.

## Suggested first steps

1. Confirm stack with James, then scaffold the content collections from the content model doc.
2. Implement tokens + shared header/button/pill components.
3. Build Home (tabs, table/cards, filters), then Build Log (infinite scroll, deep links), then the three entry templates.
4. Compare each build against the matching `.dc.html` at 1440px and 390px.
