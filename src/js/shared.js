// Content rules and markup used both by the site's pages (in the browser) and by the CMS page writer (in Node):
// derived content, date formats, URLs and small pieces of markup. Nothing here touches the DOM.

import { firstParagraph, toText } from './markdown.js';

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uniq = (xs) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b));

// ---- dates (stored as YYYY-MM-DD; parsed without time zones so the day never shifts)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (iso) => { const [y, m, d] = iso.split('-').map(Number); return { y, m: m - 1, d }; };
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
export const date = {
  long: (iso) => { const t = parts(iso); return MONTHS[t.m] + ' ' + ordinal(t.d) + ', ' + t.y; }, // October 19th, 2026
  full: (iso) => { const t = parts(iso); return MONTHS[t.m] + ' ' + t.d + ', ' + t.y; },          // October 19, 2026
  table: (iso) => { const t = parts(iso); return t.d + '-' + MONTHS[t.m].slice(0, 3) + '-' + t.y; }, // 19-Oct-2026
  short: (iso) => { const t = parts(iso); return MONTHS[t.m].slice(0, 3) + ' ' + t.d + ', ' + t.y; } // Oct 19, 2026
};

// ---- derived content. Returns new objects; the content passed in is left as it was.
export function derive(site) {
  const titles = Object.fromEntries(site.work.map((w) => [w.id, w.title]));

  // Newest first; id = YYYY-MM-DD with -2, -3 suffixes for same-day posts (oldest keeps the bare date).
  // The CMS always writes an id; this covers posts written by hand.
  const sorted = site.buildlog.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const seen = {};
  const ids = new Map();
  sorted.slice().reverse().forEach((post) => {
    seen[post.date] = (seen[post.date] || 0) + 1;
    ids.set(post, post.id || (seen[post.date] === 1 ? post.date : post.date + '-' + seen[post.date]));
  });
  const posts = sorted.map((post) => Object.assign({}, post, {
    id: ids.get(post),
    engagementTitles: (post.engagements || []).map((id) => titles[id]).filter(Boolean)
  }));

  // Last Update = the later of `updated` and the newest Build Log post referencing the engagement.
  const work = site.work.map((w) => {
    const newest = posts.find((post) => (post.engagements || []).indexOf(w.id) >= 0);
    return Object.assign({}, w, { lastUpdate: newest && newest.date > (w.updated || '') ? newest.date : w.updated });
  });

  return {
    work,
    workById: Object.fromEntries(work.map((w) => [w.id, w])),
    posts,
    casestudies: site.casestudies.slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
    letters: site.letters.slice().sort((a, b) => (a.order != null && b.order != null ? a.order - b.order : b.date.localeCompare(a.date)))
  };
}

const truncate = (text, n) => {
  if (text.length <= n) return text;
  const cut = text.slice(0, n);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '…';
};
// A written excerpt is used whole; it may hold Markdown (links, bold), so it's reduced to plain text like the body.
export const excerptOf = (post, n) => (post.excerpt ? toText(post.excerpt) : truncate(firstParagraph(post.body), n || 120));

// Work, Case Study and Letter pages are files the CMS writes: /work/<id> is served from src/work/<id>.html.
export const url = {
  work: (id) => '/work/' + encodeURIComponent(id),
  caseStudy: (id) => '/casestudies/' + encodeURIComponent(id),
  letter: (id) => '/letters/' + encodeURIComponent(id),
  post: (id) => '/buildlog#' + encodeURIComponent(id)
};

// ---- shared markup
export const pills = (skills, large) => (skills && skills.length
  ? '<ul class="pills' + (large ? ' pills--lg' : '') + '" aria-label="Skills">' + skills.map((s) => '<li class="pill">' + esc(s) + '</li>').join('') + '</ul>'
  : '');

const placeholder = (label, cls) => '<div class="ph' + (cls ? ' ' + cls : '') + '" role="img" aria-label="Image placeholder">' + esc(label || 'IMAGE') + '</div>';
// An image entry with no src yet shows the striped placeholder; no entry shows nothing.
export const image = (img, label, cls) => (!img ? '' : img.src
  ? '<img class="' + (cls || '') + '" src="' + esc(img.src) + '" alt="' + esc(img.alt || '') + '" loading="lazy">'
  : placeholder(label, cls));
// Drafts exist only in the local CMS (cms/drafts.json), so this label never reaches the public site.
export const draftTag = (item) => (item.draft ? ' <span class="draft-tag">Draft</span>' : '');
