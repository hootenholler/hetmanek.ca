// Home: the introduction, then tabs (Work, Projects, Solutions, Build Log, Letters & Articles) with filters.

import * as MD from './markdown.js';
import { esc, uniq, date, derive, excerptOf, url, skillTags, draftTag } from './shared.js';
import { PIN_ICON, filterButton, filterPanel, toggleIn, rerender } from './main.js';

(function () {
  const { work, projects, engagementById, posts, solutions, letters } = derive(window.SITE);

  // ---------- introduction (Markdown, edited in the CMS) ----------
  document.getElementById('intro').innerHTML = MD.render(window.SITE.introduction.body);

  // ---------- tabs + filters ----------
  const TABS = [
    { id: 'work', label: 'Work' },
    { id: 'projects', label: 'Projects' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'log', label: 'Build Log' },
    { id: 'articles', label: 'Letters & Articles' }
  ];
  const SKILLS = uniq([].concat(...work.map((i) => i.skills), ...projects.map((i) => i.skills), ...solutions.map((i) => i.skills), ...posts.map((i) => i.skills), ...letters.map((i) => i.skills)));
  const STATUSES = uniq(projects.map((i) => i.status));

  // Returning from a content page opens that page's tab; Back restores the tab saved in history.
  // Otherwise no tab is selected until the visitor picks one; the table appears then.
  const FROM = [['/work/', 'work'], ['/projects/', 'projects'], ['/solutions/', 'solutions'], ['/buildlog', 'log'], ['/letters/', 'articles']];
  const tabFromReferrer = () => {
    let ref;
    try { ref = new URL(document.referrer); } catch (e) { return null; }
    if (ref.origin !== location.origin) return null;
    const hit = FROM.find((f) => ref.pathname.indexOf(f[0]) === 0);
    return hit ? hit[1] : null;
  };
  const state = { tab: (history.state && history.state.tab) || tabFromReferrer(), open: false, skills: [], statuses: [] };
  const root = document.getElementById('browse');

  const skillMatch = (item) => state.skills.length === 0 || (item.skills || []).some((s) => state.skills.indexOf(s) >= 0);
  const engagementNames = (ids) => (ids || []).map((id) => (engagementById[id] || {}).title).filter(Boolean).join(', ') || '—';
  const empty = '<div class="empty">Nothing matches these filters.</div>';

  const header = (labels) => '<div class="table__row table__row--head" role="row">' + labels.map((l) => '<div role="columnheader">' + l + '</div>').join('') + '</div>';
  const table = (cls, label, labels, rows) =>
    '<div class="table-scroll only-desktop"><div class="table ' + cls + '" role="table" aria-label="' + esc(label) + '">' +
      header(labels) + rows.join('') + (rows.length ? '' : empty) +
    '</div></div>';
  const cards = (rows) => '<div class="only-mobile">' + rows.join('') + (rows.length ? '' : empty) + '</div>';

  // The Work and Projects tabs: the same table, in the order derive() gives. Status shows (and filters) on Projects only.
  const engagements = (items, href, label, cls, withStatus) => {
    const status = (i) => (withStatus ? '<div role="cell" class="cell-mono">' + esc(i.status || '—') + '</div>' : '');
    const rows = items.filter((i) => skillMatch(i) &&
      (!withStatus || state.statuses.length === 0 || state.statuses.indexOf(i.status) >= 0));
    return table(cls, label, ['ENGAGEMENT', 'DESCRIPTION', 'SKILLS'].concat(withStatus ? ['STATUS'] : []), rows.map((i) =>
      '<div class="table__row" role="row">' +
        '<div role="cell"><a class="cell-title" href="' + href(i.id) + '">' + MD.strike(i.title) + '</a>' + draftTag(i) + '</div>' +
        '<div role="cell" class="cell-text">' + MD.strike(i.desc || '—') + '</div>' +
        '<div role="cell">' + skillTags(i.skills) + '</div>' +
        status(i) +
      '</div>')) +
    cards(rows.map((i) =>
      '<div class="card">' +
        '<div class="card__top"><span><a class="card__title" href="' + href(i.id) + '">' + MD.strike(i.title) + '</a>' + draftTag(i) + '</span>' + (withStatus ? '<span class="card__mono">' + esc(i.status || '—') + '</span>' : '') + '</div>' +
        '<div class="card__text">' + MD.strike(i.desc || '—') + '</div>' +
        skillTags(i.skills) +
      '</div>'));
  };

  const views = {
    work: () => engagements(work, url.work, 'Work', 'table--work', false),
    projects: () => engagements(projects, url.project, 'Projects', 'table--projects', true),
    solutions() {
      const rows = solutions.filter(skillMatch);
      return table('table--solutions table--narrow', 'Solutions', ['TITLE', 'DESCRIPTION', 'SKILLS'], rows.map((i) =>
        '<div class="table__row" role="row">' +
          '<div role="cell"><a class="cell-title" href="' + url.solution(i.id) + '">' + MD.strike(i.title) + '</a>' + draftTag(i) + '</div>' +
          '<div role="cell" class="cell-text">' + MD.strike(i.desc || '—') + '</div>' +
          '<div role="cell">' + skillTags(i.skills) + '</div>' +
        '</div>')) +
      cards(rows.map((i) =>
        '<div class="card">' +
          '<span><a class="card__title" href="' + url.solution(i.id) + '">' + MD.strike(i.title) + '</a>' + draftTag(i) + '</span>' +
          '<div class="card__text">' + MD.strike(i.desc || '—') + '</div>' +
          skillTags(i.skills) +
        '</div>'));
    },
    log() {
      // The pinned post first, then newest first, the same order as the Build Log page.
      const rows = posts.filter((p) => p.pinned).concat(posts.filter((p) => !p.pinned)).filter(skillMatch);
      const pin = (p) => (p.pinned ? PIN_ICON + '<span class="visually-hidden">Pinned: </span>' : '');
      const more = (p) => ' <a class="read-more" href="' + url.post(p.id) + '" aria-label="Read the Build Log post from ' + date.full(p.date) + '">read more →</a>';
      return table('table--log', 'Build Log', ['DATE', 'EXCERPT', 'ENGAGEMENT', 'SKILLS'], rows.map((p) =>
        '<div class="table__row" role="row">' +
          '<div role="cell" class="cell-date"><a href="' + url.post(p.id) + '">' + date.short(p.date) + '</a>' + draftTag(p) + '</div>' +
          '<div role="cell" class="cell-text">' + pin(p) + MD.strike(excerptOf(p)) + more(p) + '</div>' +
          '<div role="cell" class="cell-text">' + MD.strike(engagementNames(p.engagements)) + '</div>' +
          '<div role="cell">' + skillTags(p.skills) + '</div>' +
        '</div>')) +
      cards(rows.map((p) =>
        '<div class="card">' +
          '<span><a class="card__date-link" href="' + url.post(p.id) + '">' + date.short(p.date) + '</a>' + draftTag(p) + '</span>' +
          '<div class="card__text">' + pin(p) + MD.strike(excerptOf(p)) + more(p) + '</div>' +
          '<div class="card__sub">' + MD.strike(engagementNames(p.engagements)) + '</div>' +
          skillTags(p.skills) +
        '</div>'));
    },
    articles() {
      const rows = letters.filter(skillMatch);
      return table('table--letters table--narrow', 'Letters & Articles', ['TITLE', 'SUMMARY', 'DATE'], rows.map((i) =>
        '<div class="table__row" role="row">' +
          '<div role="cell"><a class="cell-title" href="' + url.letter(i.id) + '">' + MD.strike(i.title) + '</a>' + draftTag(i) + '</div>' +
          '<div role="cell" class="cell-text">' + MD.strike(i.summary) + '</div>' +
          '<div role="cell" class="cell-mono cell-mono--muted">' + date.table(i.date) + '</div>' +
        '</div>')) +
      cards(rows.map((i) =>
        '<div class="card">' +
          '<span><a class="card__title" href="' + url.letter(i.id) + '">' + MD.strike(i.title) + '</a>' + draftTag(i) + '</span>' +
          '<div class="card__text">' + MD.strike(i.summary) + '</div>' +
          '<div class="card__mono card__mono--muted">' + date.table(i.date) + '</div>' +
        '</div>'));
    }
  };

  // ---------- panel motion ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const tabIndex = (id) => TABS.findIndex((t) => t.id === id);
  let shownTab = null;

  // First pick: the table wipes in top to bottom over 1s. Later picks: the old and new
  // tables slide the way the tabs run (a tab to the right brings its table in from the right),
  // clipped to the panel frame so no horizontal scrollbar appears.
  function animatePanels(prevTab, oldPanel) {
    const panel = root.querySelector('.tabpanel');
    if (!panel || reduceMotion.matches) return;
    if (!prevTab) {
      panel.animate({ clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0 0)'] }, { duration: 1000, easing: EASE });
      return;
    }
    const dir = tabIndex(state.tab) > tabIndex(prevTab) ? 1 : -1;
    const timing = { duration: 600, easing: EASE };
    oldPanel.getAnimations().forEach((a) => a.cancel());
    oldPanel.removeAttribute('id');
    oldPanel.removeAttribute('role');
    oldPanel.setAttribute('aria-hidden', 'true');
    oldPanel.inert = true;
    oldPanel.classList.add('tabpanel--leaving');
    panel.parentNode.appendChild(oldPanel);
    oldPanel.animate({ transform: ['translateX(0)', 'translateX(' + (-dir * 100) + '%)'] }, timing).onfinish = () => oldPanel.remove();
    panel.animate({ transform: ['translateX(' + (dir * 100) + '%)', 'translateX(0)'] }, timing);
  }

  function render() {
    const prevTab = shownTab;
    const oldPanel = root.querySelector('.tabpanel:not(.tabpanel--leaving)');
    const byStatus = state.tab === 'projects'; // the one tab that also filters by Status
    const active = state.skills.length + (byStatus ? state.statuses.length : 0);
    const groups = [{ key: 'skills', label: 'SKILLS', options: SKILLS, selected: state.skills }];
    if (byStatus) groups.push({ key: 'statuses', label: 'STATUS', options: STATUSES, selected: state.statuses });

    rerender(root,
      '<div class="tabbar">' +
        '<div class="tabs-wrap"><div class="tabs" role="tablist" aria-label="Sections">' +
          TABS.map((t, i) => {
            const on = t.id === state.tab;
            const focusable = on || (!state.tab && i === 0);
            return '<button type="button" class="tab" role="tab" id="tab-' + t.id + '" data-action="tab" data-tab="' + t.id + '" aria-selected="' + on + '"' + (on ? ' aria-controls="tabpanel"' : '') + ' tabindex="' + (focusable ? 0 : -1) + '">' + esc(t.label) + '</button>';
          }).join('') +
        '</div></div>' +
        // Invisible until a tab is picked (no table yet for them to act on). Hidden rather than left out, so the tab
        // bar keeps its height and doesn't jump when the button appears; visibility also takes it out of tab order.
        '<div class="filter-controls' + (state.tab ? '' : ' filter-controls--waiting') + '">' +
          filterButton(state.open, active, 'home-filters') +
          (active ? '<button type="button" class="clear-filters" data-action="clear">Clear filters</button>' : '') +
        '</div>' +
      '</div>' +
      (state.open ? filterPanel(groups, 'home-filters') : '') +
      '<div class="panels">' +
        (state.tab ? '<div class="tabpanel" role="tabpanel" id="tabpanel" aria-labelledby="tab-' + state.tab + '">' + views[state.tab]() + '</div>' : '') +
      '</div>'
    );
    shownTab = state.tab;
    if (state.tab && homeTop.classList.contains('home-top--centred')) release();
    if (state.tab !== prevTab) {
      animatePanels(prevTab, oldPanel);
      history.replaceState(Object.assign({}, history.state, { tab: state.tab }), '');
    }
  }

  // ---------- home-top + tab bar: centred in the window until the first tab is picked ----------
  // The block runs from the top of home-top's content to the bottom of the tab bar. Centring it needs its height,
  // which CSS can't read, so it's measured here and handed to CSS as --centre-pad (home-top's top padding);
  // CSS applies it on desktop only and runs the slide. The padding moves the whole block, so the block's height
  // doesn't depend on it. Rejected: min-height: 100svh with align-content: center (centres home-top alone and
  // pushes the tabs below the fold); interpolate-size (Chromium only).
  const homeTop = document.querySelector('.home-top');
  const centre = () => {
    const top = homeTop.getBoundingClientRect().top + parseFloat(getComputedStyle(homeTop).paddingTop);
    const block = root.querySelector('.tabbar').getBoundingClientRect().bottom - top;
    const above = homeTop.getBoundingClientRect().top + scrollY;
    homeTop.style.setProperty('--centre-pad', Math.round((document.documentElement.clientHeight - block) / 2 - above) + 'px');
  };
  // Adding the transition and dropping the centred padding in one step makes the browser animate between them.
  function release() {
    removeEventListener('resize', centre);
    homeTop.classList.add('home-top--releasing');
    homeTop.classList.remove('home-top--centred');
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'tab') state.tab = btn.dataset.tab;
    else if (action === 'toggle-filter') state.open = !state.open;
    else if (action === 'pick') state[btn.dataset.key] = toggleIn(state[btn.dataset.key], btn.dataset.value);
    else if (action === 'clear') { state.skills = []; state.statuses = []; }
    else return;
    render();
    if (action === 'clear') root.querySelector('[data-action="toggle-filter"]').focus();
  });

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  root.addEventListener('keydown', (e) => {
    if (!e.target.matches('[role="tab"]')) return;
    const i = tabIndex(e.target.dataset.tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    state.tab = TABS[(next + TABS.length) % TABS.length].id;
    render();
    root.querySelector('#tab-' + state.tab).focus();
  });

  render();
  // After the first render, so the tab bar exists to be measured.
  if (!state.tab) {
    homeTop.classList.add('home-top--centred');
    centre();
    addEventListener('resize', centre);
    document.fonts.ready.then(centre); // the serif's real height can differ from the fallback's
  }
})();
