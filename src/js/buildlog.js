// Build Log: the pinned post, then posts newest first, 3 at a time (more load as the reader nears the bottom),
// Skills + Engagements filters, and /buildlog#<id> deep links.

(function () {
  const { esc, uniq, date, posts, hashtag } = window.H;
  const STEP = 3;
  const NEAR_BOTTOM = 240;

  const ALL_SKILLS = uniq([].concat(...posts.map((p) => p.skills || [])));
  const ALL_ENGS = uniq([].concat(...posts.map((p) => p.engagementTitles)));

  const state = { visible: STEP, open: false, skills: [], engs: [] };
  const controls = document.getElementById('log-controls');
  const postsEl = document.getElementById('posts');

  const ordered = posts.filter((p) => p.pinned).concat(posts.filter((p) => !p.pinned));
  const list = () => ordered.filter((p) =>
    (state.skills.length === 0 || (p.skills || []).some((s) => state.skills.indexOf(s) >= 0)) &&
    (state.engs.length === 0 || p.engagementTitles.some((e) => state.engs.indexOf(e) >= 0)));

  function renderControls() {
    const count = state.skills.length + state.engs.length;
    const selected = state.engs.map((v) => ({ key: 'engs', v })).concat(state.skills.map((v) => ({ key: 'skills', v })));
    H.rerender(controls,
      '<div class="log-actions">' +
        '<a class="btn-outline" href="/">← Home</a>' +
        H.filterButton(state.open, count, 'log-filters', 'filter-btn--earth') +
      '</div>' +
      (!state.open && selected.length
        ? '<div class="chips">' + selected.map((s) =>
            '<button type="button" class="chip" data-action="remove" data-key="' + s.key + '" data-value="' + esc(s.v) + '" aria-label="Remove filter ' + esc(s.v) + '">' + esc(s.v) + '<span aria-hidden="true">×</span></button>'
          ).join('') + '</div>'
        : '') +
      (state.open
        ? H.filterPanel([
            { key: 'skills', label: 'SKILLS', options: ALL_SKILLS, selected: state.skills },
            { key: 'engs', label: 'ENGAGEMENTS', options: ALL_ENGS, selected: state.engs }
          ], 'log-filters')
        : '')
    );
  }

  function renderPosts() {
    const shown = list();
    postsEl.innerHTML = shown.length
      ? shown.slice(0, state.visible).map((p) =>
          '<article class="post" id="' + esc(p.id) + '">' +
            '<div>' + (p.pinned ? H.PIN_ICON + '<span class="visually-hidden">Pinned: </span>' : '') + '<a class="post__date" href="#' + esc(p.id) + '" title="www.hetmanek.ca/buildlog#' + esc(p.id) + '">' + date.long(p.date) + '</a>' + H.draftTag(p) + '</div>' +
            '<div class="prose post__body">' + MD.render(p.body) + '</div>' +
            '<ul class="post__tags" aria-label="Tags">' + p.engagementTitles.concat(p.skills || []).map((t) => '<li>' + esc(hashtag(t)) + '</li>').join('') + '</ul>' +
          '</article>'
        ).join('')
      : '<div class="empty">No posts match these filters.</div>';
    requestAnimationFrame(fillViewport);
  }

  // Loads the next 3 only when the reader scrolls within 240px of the bottom.
  function maybeLoad() {
    const total = list().length;
    if (state.visible >= total) return;
    const el = document.scrollingElement || document.documentElement;
    if (el.scrollTop + window.innerHeight >= el.scrollHeight - NEAR_BOTTOM) {
      state.visible = Math.min(total, state.visible + STEP);
      renderPosts();
    }
  }
  // If the page is too short to scroll (tall screens), the reader could never trigger a load, so load more.
  function fillViewport() {
    const el = document.scrollingElement || document.documentElement;
    if (el.scrollHeight <= window.innerHeight && state.visible < list().length) {
      state.visible += STEP;
      renderPosts();
    }
  }

  // /buildlog#<id> loads far enough to include the post (clearing filters that hide it), then scrolls to it.
  function goToHash() {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    if (!posts.some((p) => p.id === id)) return;
    if (!list().some((p) => p.id === id)) {
      state.skills = []; state.engs = [];
      renderControls();
    }
    const pos = list().findIndex((p) => p.id === id);
    const need = Math.ceil((pos + 1) / STEP) * STEP;
    if (need > state.visible) state.visible = need;
    renderPosts();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView();
      target.querySelector('.post__date').focus({ preventScroll: true });
    }
  }

  controls.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'toggle-filter') { state.open = !state.open; renderControls(); return; }
    if (action !== 'pick' && action !== 'remove') return;
    state[btn.dataset.key] = H.toggleIn(state[btn.dataset.key], btn.dataset.value);
    state.visible = STEP;
    renderControls();
    renderPosts();
    if (action === 'remove') controls.querySelector('[data-action="toggle-filter"]').focus();
  });

  window.addEventListener('scroll', maybeLoad, { passive: true });
  window.addEventListener('hashchange', goToHash);

  renderControls();
  renderPosts();
  if (location.hash) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(goToHash);
    else goToHash();
  }
})();
