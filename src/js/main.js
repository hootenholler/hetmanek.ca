// Shared helpers: derived content, date formats, and markup used on more than one page.

window.H = (function () {
  const S = window.SITE;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uniq = (xs) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  // Drafts are hidden on the public site and shown when running the local CMS.
  const live = (xs) => xs.filter((x) => !x.draft || window.CMS_MODE);

  // ---- dates (stored as YYYY-MM-DD; parsed without time zones so the day never shifts)
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = (iso) => { const [y, m, d] = iso.split('-').map(Number); return { y, m: m - 1, d }; };
  const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const date = {
    long: (iso) => { const t = parts(iso); return MONTHS[t.m] + ' ' + ordinal(t.d) + ', ' + t.y; }, // October 19th, 2026
    full: (iso) => { const t = parts(iso); return MONTHS[t.m] + ' ' + t.d + ', ' + t.y; },          // October 19, 2026
    table: (iso) => { const t = parts(iso); return t.d + '-' + MONTHS[t.m].slice(0, 3) + '-' + t.y; }, // 19-Oct-2026
    short: (iso) => { const t = parts(iso); return MONTHS[t.m].slice(0, 3) + ' ' + t.d + ', ' + t.y; } // Oct 19, 2026
  };

  // ---- derived content
  const work = live(S.work);
  const workById = Object.fromEntries(work.map((w) => [w.id, w]));

  // Newest first; id = YYYY-MM-DD with -2, -3 suffixes for same-day posts (oldest keeps the bare date).
  const posts = (function () {
    const sorted = live(S.buildlog).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const seen = {};
    sorted.slice().reverse().forEach((post) => {
      seen[post.date] = (seen[post.date] || 0) + 1;
      if (!post.id) post.id = seen[post.date] === 1 ? post.date : post.date + '-' + seen[post.date];
    });
    return sorted.map((post) => Object.assign({}, post, {
      engagementTitles: (post.engagements || []).map((id) => (workById[id] || {}).title).filter(Boolean)
    }));
  })();

  // Last Update = the later of `updated` and the newest Build Log post referencing the engagement.
  work.forEach((w) => {
    const newest = posts.find((post) => (post.engagements || []).indexOf(w.id) >= 0);
    w.lastUpdate = newest && newest.date > (w.updated || '') ? newest.date : w.updated;
  });

  const casestudies = live(S.casestudies).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const letters = live(S.letters).slice().sort((a, b) => (a.order != null && b.order != null ? a.order - b.order : b.date.localeCompare(a.date)));

  const truncate = (text, n) => {
    if (text.length <= n) return text;
    const cut = text.slice(0, n);
    return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '…';
  };
  const excerptOf = (post, n) => post.excerpt || truncate(MD.firstParagraph(post.body), n || 120);

  const hashtag = (name) => '#' + name.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

  // ---- routing: /work/<id> (served by the template via _redirects), or ?id=<id> as a fallback
  const routeId = () => {
    const q = new URLSearchParams(location.search).get('id');
    if (q) return q;
    const seg = location.pathname.split('/').filter(Boolean);
    return seg.length > 1 ? decodeURIComponent(seg[seg.length - 1]) : '';
  };
  const url = {
    work: (id) => '/work/' + encodeURIComponent(id),
    caseStudy: (id) => '/casestudies/' + encodeURIComponent(id),
    letter: (id) => '/letters/' + encodeURIComponent(id),
    post: (id) => '/buildlog#' + encodeURIComponent(id)
  };

  // ---- shared markup
  const pills = (skills, large) => (skills && skills.length
    ? '<ul class="pills' + (large ? ' pills--lg' : '') + '" aria-label="Skills">' + skills.map((s) => '<li class="pill">' + esc(s) + '</li>').join('') + '</ul>'
    : '');

  const placeholder = (label, cls) => '<div class="ph' + (cls ? ' ' + cls : '') + '" role="img" aria-label="Image placeholder">' + esc(label || 'IMAGE') + '</div>';
  // An image entry with no src yet shows the striped placeholder; no entry shows nothing.
  const image = (img, label, cls) => (!img ? '' : img.src
    ? '<img class="' + (cls || '') + '" src="' + esc(img.src) + '" alt="' + esc(img.alt || '') + '" loading="lazy">'
    : placeholder(label, cls));
  const draftTag = (item) => (item.draft ? ' <span class="draft-tag">Draft</span>' : '');

  const FILTER_ICON = {
    closed: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M4.5 8h7M7 12h2"/></svg>',
    open: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M7 4h2M4.5 8h7M2 12h12"/></svg>'
  };
  const filterButton = (open, count, panelId, cls) =>
    '<button type="button" class="filter-btn' + (cls ? ' ' + cls : '') + '" data-action="toggle-filter" aria-expanded="' + open + '" aria-controls="' + panelId + '">' +
      (open ? FILTER_ICON.open : FILTER_ICON.closed) + 'Filter' + (count ? ' (' + count + ')' : '') +
    '</button>';

  // groups: [{ key, label, options: [...], selected: [...] }]
  const filterPanel = (groups, panelId, cls) =>
    '<div class="filter-panel' + (cls ? ' ' + cls : '') + '" id="' + panelId + '">' +
      groups.map((g) =>
        '<div class="filter-group" role="group" aria-labelledby="' + panelId + '-' + g.key + '">' +
          '<div class="filter-group__label" id="' + panelId + '-' + g.key + '">' + esc(g.label) + '</div>' +
          '<div class="filter-options">' + g.options.map((o) =>
            '<button type="button" class="filter-option" data-action="pick" data-key="' + g.key + '" data-value="' + esc(o) + '" aria-pressed="' + (g.selected.indexOf(o) >= 0) + '">' + esc(o) + '</button>'
          ).join('') + '</div>' +
        '</div>'
      ).join('') +
    '</div>';

  // Shown by the entry templates when the URL doesn't match any published entry.
  const notFound = (main, what) => {
    document.title = 'Not found · James Hetmanek';
    main.innerHTML =
      '<div class="not-found">' +
        '<h1 class="page-title">' + esc(what) + ' not found</h1>' +
        '<p>That page doesn’t exist, or it has moved.</p>' +
        '<a class="btn-outline" href="/">← Home</a>' +
      '</div>';
  };

  const toggleIn = (list, value) => (list.indexOf(value) >= 0 ? list.filter((x) => x !== value) : list.concat([value]));

  // Re-render helper that keeps keyboard focus on the same control after innerHTML replaces it.
  const rerender = (root, html) => {
    const active = document.activeElement;
    const key = active && root.contains(active) && active.dataset
      ? ['action', 'key', 'value', 'tab'].map((k) => active.dataset[k] || '').join('|')
      : null;
    root.innerHTML = html;
    if (key) {
      const match = Array.from(root.querySelectorAll('button, a')).find((el) =>
        ['action', 'key', 'value', 'tab'].map((k) => el.dataset[k] || '').join('|') === key);
      if (match) match.focus();
    }
  };

  return { esc, uniq, date, work, workById, posts, casestudies, letters, excerptOf, truncate, hashtag, routeId, url, pills, image, placeholder, draftTag, filterButton, filterPanel, toggleIn, rerender, notFound, LINKEDIN_URL: S.linkedin };
})();
