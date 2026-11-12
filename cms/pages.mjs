// Finished HTML for Work, Project, Solution and Letter entries, so those pages work without JavaScript and give
// link previews a real title and description. The server writes these to src/<type>/<id>.html on every save,
// and renders drafts the same way on request. A Dev0 exception approved by James on 2026-10-29 (see CLAUDE.md).
// This file only builds strings; the server does the file writing.

import fs from 'node:fs';
import * as MD from '../src/js/markdown.js';
import { esc, date, derive, excerptOf, url, skillTags, image, draftTag } from '../src/js/shared.js';

const TEMPLATE = fs.readFileSync(new URL('./page.html', import.meta.url), 'utf8');
const DEFAULT_DESCRIPTION = 'James Hetmanek: listen, learn, design, build.';

// Folder under src/ for each type. Every .html file in these folders is written by the CMS.
export const TYPES = ['work', 'projects', 'solutions', 'letters'];

// Work and Project pages share one layout.
function engagement(w, d) {
  const meta =
    '<dl class="meta">' +
      // One row, "Oct 2024 – Present": no end date means the work is still going; no start date shows a dash.
      [['DATES', w.started ? date.month(w.started) + ' – ' + (w.ended ? date.month(w.ended) : 'Present') : '—'],
       ['SKILLS', skillTags(w.skills) || '—']
      ].map((r) => '<div class="meta__row"><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') +
    '</dl>';

  // Only the three newest of each; posts are already newest first, letters may be ordered by hand.
  const about = (x) => (x.engagements || []).indexOf(w.id) >= 0;
  const logPosts = d.posts.filter(about).slice(0, 3);
  const letters = d.letters.filter(about).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const section = (id, label, items) => items.length
    ? '<section class="related" aria-labelledby="' + id + '"><h2 class="mono-label" id="' + id + '">' + label + '</h2><ul class="related__list">' + items.join('') + '</ul></section>'
    : '';
  const item = (href, when, text) =>
    '<li><a class="related__item" href="' + href + '">' +
      '<div class="related__item-date">' + date.long(when) + '</div>' +
      '<div class="related__item-text">' + MD.strike(text) + '</div>' +
    '</a></li>';
  const related =
    section('related-letters', 'LETTERS &amp; ARTICLES', letters.map((l) => item(url.letter(l.id), l.date, l.title))) +
    section('related-log', 'BUILD LOG', logPosts.map((p) => item(url.post(p.id), p.date, excerptOf(p, 140))));

  return {
    title: w.title,
    description: w.desc,
    main:
      '<article class="work">' +
        '<div class="work__main">' +
          '<div><h1 class="page-title">' + MD.strike(w.title) + draftTag(w) + '</h1><div class="page-desc">' + MD.strike(w.desc || '') + '</div></div>' +
          '<div class="only-mobile">' + meta + '</div>' +
          (w.body ? '<div class="prose">' + MD.render(w.body) + '</div>' : '') +
          (w.gallery && w.gallery.length
            ? '<div class="gallery">' + w.gallery.map((img, i) => image(img, 'IMAGE ' + (i + 1))).join('') + '</div>'
            : '') +
        '</div>' +
        '<aside class="work__aside" aria-label="Details">' +
          '<div class="only-desktop">' + meta + '</div>' + related +
        '</aside>' +
      '</article>'
  };
}

// Two columns like Work pages (the .work layout): title, description and body on the left, skills on the right.
// On mobile the skills sit under the description, as Work's details do.
function solution(c) {
  const meta = '<dl class="meta"><div class="meta__row"><dt>SKILLS</dt><dd>' + (skillTags(c.skills) || '—') + '</dd></div></dl>';
  return {
    title: c.title,
    description: c.desc,
    main:
      '<article class="work">' +
        '<div class="work__main">' +
          '<div><div class="solution__eyebrow">Solution</div><h1 class="page-title">' + MD.strike(c.title) + draftTag(c) + '</h1>' +
            (c.desc ? '<div class="page-desc">' + MD.strike(c.desc) + '</div>' : '') + '</div>' +
          '<div class="only-mobile">' + meta + '</div>' +
          (c.body ? '<div class="prose">' + MD.render(c.body) + '</div>' : '') +
        '</div>' +
        '<aside class="work__aside" aria-label="Details"><div class="only-desktop">' + meta + '</div></aside>' +
      '</article>'
  };
}

function letter(l) {
  return {
    title: l.title,
    description: l.summary,
    main:
      '<article class="letter">' +
        '<div class="letter__date"><time datetime="' + esc(l.date) + '">' + date.full(l.date) + '</time></div>' +
        '<h1 class="page-title">' + MD.strike(l.title) + draftTag(l) + '</h1>' +
        (l.image ? image(l.image, 'IMAGE PLACEHOLDER · 3:2', 'letter__image') : '') +
        '<div class="prose">' + MD.render(l.body) + '</div>' +
        skillTags(l.skills) +
      '</article>'
  };
}

const RENDER = { work: engagement, projects: engagement, solutions: solution, letters: letter };

// {{main}} is filled last, so text inside an entry's body is never read as a slot.
function page(type, entry, d) {
  const p = RENDER[type](entry, d);
  return TEMPLATE
    .replaceAll('{{title}}', () => esc(MD.unstrike(p.title)))
    .replaceAll('{{description}}', () => esc(MD.unstrike(p.description) || DEFAULT_DESCRIPTION))
    .replace('{{main}}', () => p.main);
}

// Every page for this content, as [{ type, id, html }].
export function renderPages(site) {
  const d = derive(site);
  return TYPES.flatMap((type) => d[type].map((entry) => ({ type, id: entry.id, html: page(type, entry, d) })));
}

// One page, or null when there's no such entry.
export function renderPage(site, type, id) {
  const d = derive(site);
  const entry = d[type].find((x) => x.id === id);
  return entry ? page(type, entry, d) : null;
}
