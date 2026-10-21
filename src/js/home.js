// Home: Build Log excerpts, then tabs (Work, Case Studies, Build Log, Letters & Articles) with filters.

(function () {
  const { esc, uniq, date, work, workById, posts, casestudies, letters, excerptOf, url, pills } = window.H;

  document.getElementById('linkedin').href = H.LINKEDIN_URL;

  // ---------- excerpts ----------
  const excerptsEl = document.getElementById('excerpts');
  const pinned = posts.find((p) => p.pinned);
  const newest = posts.find((p) => !p.pinned);
  const readMoreLabel = (post) => 'Read the Build Log post from ' + date.full(post.date);

  let excerptsHtml = '';
  if (pinned) {
    excerptsHtml +=
      '<article class="excerpt"><p>' +
        '<b class="excerpt__pinned">PINNED</b> <b class="excerpt__date">— ' + date.full(pinned.date) + '</b> ' +
        esc(excerptOf(pinned, 400)) + '&nbsp;&nbsp;&nbsp;' +
        '<a class="read-more" href="' + url.post(pinned.id) + '" aria-label="' + readMoreLabel(pinned) + '">read more →</a>' +
      '</p></article>';
  }
  if (newest) {
    excerptsHtml +=
      '<article class="excerpt"><p>' +
        '<b class="excerpt__date">' + date.full(newest.date) + '</b> ' + esc(MD.toText(newest.body)) + ' ' +
        '<a class="read-more read-more--fade" href="' + url.post(newest.id) + '" aria-label="' + readMoreLabel(newest) + '">… read more →</a>' +
      '</p></article>';
  }
  excerptsEl.innerHTML = excerptsHtml;

  // The link is inline when the text fits in 3 lines, and pinned to the end of line 3 (with a fade) when it doesn't.
  const fitReadMore = () => {
    excerptsEl.querySelectorAll('.excerpt p').forEach((p) => {
      const link = p.querySelector('.read-more');
      link.classList.remove('read-more--fade');
      link.textContent = 'read more →';
      if (p.scrollHeight > p.clientHeight + 1) {
        link.classList.add('read-more--fade');
        link.textContent = '… read more →';
      }
    });
  };
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitReadMore, 100); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitReadMore);
  fitReadMore();

  // ---------- tabs + filters ----------
  const TABS = [
    { id: 'work', label: 'Work' },
    { id: 'cases', label: 'Case Studies' },
    { id: 'log', label: 'Build Log' },
    { id: 'articles', label: 'Letters & Articles' }
  ];
  const SKILLS = uniq([].concat(...work.map((i) => i.skills), ...casestudies.map((i) => i.skills), ...posts.map((i) => i.skills), ...letters.map((i) => i.skills)));
  const STATUSES = uniq(work.map((i) => i.status));

  const state = { tab: 'work', open: false, skills: [], statuses: [] };
  const root = document.getElementById('browse');

  const skillMatch = (item) => state.skills.length === 0 || (item.skills || []).some((s) => state.skills.indexOf(s) >= 0);
  const engagementNames = (ids) => (ids || []).map((id) => (workById[id] || {}).title).filter(Boolean).join(', ') || '—';
  const empty = '<div class="empty">Nothing matches these filters.</div>';

  const header = (labels) => '<div class="table__row table__row--head" role="row">' + labels.map((l) => '<div role="columnheader">' + l + '</div>').join('') + '</div>';
  const table = (cls, label, labels, rows) =>
    '<div class="table-scroll only-desktop"><div class="table ' + cls + '" role="table" aria-label="' + esc(label) + '">' +
      header(labels) + rows.join('') + (rows.length ? '' : empty) +
    '</div></div>';
  const cards = (rows) => '<div class="only-mobile">' + rows.join('') + (rows.length ? '' : empty) + '</div>';

  const views = {
    work() {
      const rows = work.filter((i) => skillMatch(i) && (state.statuses.length === 0 || state.statuses.indexOf(i.status) >= 0));
      return table('table--work', 'Work', ['ENGAGEMENT', 'DESCRIPTION', 'SKILLS', 'LAST UPDATE', 'STATUS'], rows.map((i) =>
        '<div class="table__row" role="row">' +
          '<div role="cell"><a class="cell-title" href="' + url.work(i.id) + '">' + esc(i.title) + '</a>' + H.draftTag(i) + '</div>' +
          '<div role="cell" class="cell-text">' + esc(i.desc || '—') + '</div>' +
          '<div role="cell">' + pills(i.skills) + '</div>' +
          '<div role="cell" class="cell-mono cell-mono--muted">' + (i.lastUpdate ? date.table(i.lastUpdate) : '—') + '</div>' +
          '<div role="cell" class="cell-mono">' + esc(i.status || '—') + '</div>' +
        '</div>')) +
      cards(rows.map((i) =>
        '<div class="card">' +
          '<div class="card__top"><span><a class="card__title" href="' + url.work(i.id) + '">' + esc(i.title) + '</a>' + H.draftTag(i) + '</span><span class="card__mono">' + esc(i.status || '—') + '</span></div>' +
          '<div class="card__text">' + esc(i.desc || '—') + '</div>' +
          pills(i.skills) +
          '<div class="card__mono card__mono--muted">' + (i.lastUpdate ? date.table(i.lastUpdate) : '—') + '</div>' +
        '</div>'));
    },
    cases() {
      const rows = casestudies.filter(skillMatch);
      return table('table--cases table--narrow', 'Case Studies', ['OPPORTUNITY', 'ENGAGEMENT', 'SKILLS'], rows.map((i) =>
        '<div class="table__row" role="row">' +
          '<div role="cell"><a class="cell-title" href="' + url.caseStudy(i.id) + '">' + esc(i.title) + '</a>' + H.draftTag(i) + '</div>' +
          '<div role="cell" class="cell-text">' + esc(engagementNames(i.engagement ? [i.engagement] : [])) + '</div>' +
          '<div role="cell">' + pills(i.skills) + '</div>' +
        '</div>')) +
      cards(rows.map((i) =>
        '<div class="card">' +
          '<span><a class="card__title" href="' + url.caseStudy(i.id) + '">' + esc(i.title) + '</a>' + H.draftTag(i) + '</span>' +
          '<div class="card__text">' + esc(engagementNames(i.engagement ? [i.engagement] : [])) + '</div>' +
          pills(i.skills) +
        '</div>'));
    },
    log() {
      const rows = posts.filter(skillMatch);
      const more = (p) => ' <a class="read-more" href="' + url.post(p.id) + '" aria-label="Read the Build Log post from ' + date.full(p.date) + '">read more →</a>';
      return table('table--log', 'Build Log', ['DATE', 'EXCERPT', 'ENGAGEMENT', 'SKILLS'], rows.map((p) =>
        '<div class="table__row" role="row">' +
          '<div role="cell" class="cell-date"><a href="' + url.post(p.id) + '">' + date.short(p.date) + '</a>' + H.draftTag(p) + '</div>' +
          '<div role="cell" class="cell-text">' + esc(excerptOf(p)) + more(p) + '</div>' +
          '<div role="cell" class="cell-text">' + esc(engagementNames(p.engagements)) + '</div>' +
          '<div role="cell">' + pills(p.skills) + '</div>' +
        '</div>')) +
      cards(rows.map((p) =>
        '<div class="card">' +
          '<span><a class="card__date-link" href="' + url.post(p.id) + '">' + date.short(p.date) + '</a>' + H.draftTag(p) + '</span>' +
          '<div class="card__text">' + esc(excerptOf(p)) + more(p) + '</div>' +
          '<div class="card__sub">' + esc(engagementNames(p.engagements)) + '</div>' +
          pills(p.skills) +
        '</div>'));
    },
    articles() {
      const rows = letters.filter(skillMatch);
      return table('table--letters table--narrow', 'Letters & Articles', ['TITLE', 'SUMMARY', 'SKILLS', 'DATE'], rows.map((i) =>
        '<div class="table__row" role="row">' +
          '<div role="cell"><a class="cell-title" href="' + url.letter(i.id) + '">' + esc(i.title) + '</a>' + H.draftTag(i) + '</div>' +
          '<div role="cell" class="cell-text">' + esc(i.summary) + '</div>' +
          '<div role="cell">' + pills(i.skills) + '</div>' +
          '<div role="cell" class="cell-mono cell-mono--muted">' + date.table(i.date) + '</div>' +
        '</div>')) +
      cards(rows.map((i) =>
        '<div class="card">' +
          '<span><a class="card__title" href="' + url.letter(i.id) + '">' + esc(i.title) + '</a>' + H.draftTag(i) + '</span>' +
          '<div class="card__text">' + esc(i.summary) + '</div>' +
          pills(i.skills) +
          '<div class="card__mono card__mono--muted">' + date.table(i.date) + '</div>' +
        '</div>'));
    }
  };

  function render() {
    const isWork = state.tab === 'work';
    const active = state.skills.length + (isWork ? state.statuses.length : 0);
    const groups = [{ key: 'skills', label: 'SKILLS', options: SKILLS, selected: state.skills }];
    if (isWork) groups.push({ key: 'statuses', label: 'STATUS', options: STATUSES, selected: state.statuses });

    H.rerender(root,
      '<div class="tabbar">' +
        '<div class="tabs-wrap"><div class="tabs" role="tablist" aria-label="Sections">' +
          TABS.map((t) => {
            const on = t.id === state.tab;
            return '<button type="button" class="tab" role="tab" id="tab-' + t.id + '" data-action="tab" data-tab="' + t.id + '" aria-selected="' + on + '" aria-controls="tabpanel" tabindex="' + (on ? 0 : -1) + '">' + esc(t.label) + '</button>';
          }).join('') +
        '</div></div>' +
        '<div class="filter-controls">' +
          H.filterButton(state.open, active, 'home-filters') +
          (active ? '<button type="button" class="clear-filters" data-action="clear">Clear filters</button>' : '') +
        '</div>' +
      '</div>' +
      (state.open ? H.filterPanel(groups, 'home-filters') : '') +
      '<div role="tabpanel" id="tabpanel" aria-labelledby="tab-' + state.tab + '">' + views[state.tab]() + '</div>'
    );
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'tab') state.tab = btn.dataset.tab;
    else if (action === 'toggle-filter') state.open = !state.open;
    else if (action === 'pick') state[btn.dataset.key] = H.toggleIn(state[btn.dataset.key], btn.dataset.value);
    else if (action === 'clear') { state.skills = []; state.statuses = []; }
    else return;
    render();
    if (action === 'clear') root.querySelector('[data-action="toggle-filter"]').focus();
  });

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  root.addEventListener('keydown', (e) => {
    if (!e.target.matches('[role="tab"]')) return;
    const i = TABS.findIndex((t) => t.id === state.tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    state.tab = TABS[(next + TABS.length) % TABS.length].id;
    render();
    root.querySelector('#tab-' + state.tab).focus();
  });

  render();
})();
