// Finished HTML for Work, Case Study and Letter entries, so those pages work without JavaScript and give
// link previews a real title and description. The server writes these to src/<type>/<id>.html on every save,
// and renders drafts the same way on request. A Dev0 exception approved by James on 2026-10-29 (see CLAUDE.md).
// This file only builds strings; the server does the file writing.

import fs from 'node:fs';
import * as MD from '../src/js/markdown.js';
import { esc, date, derive, excerptOf, url, pills, image, draftTag } from '../src/js/shared.js';

const TEMPLATE = fs.readFileSync(new URL('./page.html', import.meta.url), 'utf8');
const DEFAULT_DESCRIPTION = 'James Hetmanek: listen, learn, design, build.';

// Folder under src/ for each type. Every .html file in these folders is written by the CMS.
export const TYPES = ['work', 'casestudies', 'letters'];

function work(w, d) {
  const meta =
    '<dl class="meta">' +
      [['TYPE', esc(w.type || '—')],
       ['STATUS', esc(w.status || '—')],
       ['LAST UPDATE', w.lastUpdate ? date.table(w.lastUpdate) : '—'],
       ['SKILLS', pills(w.skills, true) || '—']
      ].map((r) => '<div class="meta__row"><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') +
    '</dl>';

  const logPosts = d.posts.filter((p) => (p.engagements || []).indexOf(w.id) >= 0);
  const logSection = logPosts.length
    ? '<section class="related" aria-labelledby="related-log"><h2 class="mono-label" id="related-log">BUILD LOG</h2><ul class="related__list">' +
        logPosts.map((p) =>
          '<li><a class="related__item" href="' + url.post(p.id) + '">' +
            '<div class="related__item-date">' + date.long(p.date) + '</div>' +
            '<div class="related__item-text">' + esc(excerptOf(p, 140)) + '</div>' +
          '</a></li>').join('') +
      '</ul></section>'
    : '';

  return {
    title: w.title,
    description: w.desc,
    main:
      '<article class="work">' +
        '<div class="work__main">' +
          '<div><h1 class="page-title">' + esc(w.title) + draftTag(w) + '</h1><div class="work__desc">' + esc(w.desc || '') + '</div></div>' +
          '<div class="only-mobile">' + meta + '</div>' +
          (w.body ? '<div class="prose">' + MD.render(w.body) + '</div>' : '') +
          (w.gallery && w.gallery.length
            ? '<div class="gallery">' + w.gallery.map((img, i) => image(img, 'IMAGE ' + (i + 1))).join('') + '</div>'
            : '') +
        '</div>' +
        '<aside class="work__aside" aria-label="Details">' +
          '<div class="only-desktop">' + meta + '</div>' + logSection +
        '</aside>' +
      '</article>'
  };
}

function caseStudy(c) {
  return {
    title: c.title,
    description: c.description,
    main:
      '<article class="case">' +
        '<div>' +
          '<div class="case__eyebrow">Case Study</div>' +
          '<h1 class="page-title">' + esc(c.title) + draftTag(c) + '</h1>' +
        '</div>' +
        pills(c.skills, true) +
        (c.sections || []).map((s) =>
          '<section class="case__section">' +
            '<h2 class="case__label">' + esc(s.label) + '</h2>' +
            '<div class="case__body">' +
              '<div class="prose">' + MD.render(s.body) + '</div>' +
              (s.image ? '<div class="case__figure">' + image(s.image) + '</div>' : '') +
            '</div>' +
          '</section>').join('') +
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
        '<h1 class="page-title">' + esc(l.title) + draftTag(l) + '</h1>' +
        (l.summary ? '<div class="letter__summary">' + esc(l.summary) + '</div>' : '') +
        (l.image ? image(l.image, 'IMAGE PLACEHOLDER · 3:2', 'letter__image') : '') +
        '<div class="prose">' + MD.render(l.body) + '</div>' +
        pills(l.skills, true) +
      '</article>'
  };
}

const RENDER = { work, casestudies: caseStudy, letters: letter };

// {{main}} is filled last, so text inside an entry's body is never read as a slot.
function page(type, entry, d) {
  const p = RENDER[type](entry, d);
  return TEMPLATE
    .replaceAll('{{title}}', () => esc(p.title))
    .replaceAll('{{description}}', () => esc(p.description || DEFAULT_DESCRIPTION))
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
