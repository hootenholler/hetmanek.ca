// Browser-only helpers shared by Home and the Build Log: filter controls, the pin icon, and focus-keeping re-renders.

import { esc } from './shared.js';

const FILTER_ICON = {
  closed: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M4.5 8h7M7 12h2"/></svg>',
  open: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M7 4h2M4.5 8h7M2 12h12"/></svg>'
};
export const filterButton = (open, count, panelId, cls) =>
  '<button type="button" class="filter-btn' + (cls ? ' ' + cls : '') + '" data-action="toggle-filter" aria-expanded="' + open + '" aria-controls="' + panelId + '">' +
    (open ? FILTER_ICON.open : FILTER_ICON.closed) + 'Filter' + (count ? ' (' + count + ')' : '') +
  '</button>';

// groups: [{ key, label, options: [...], selected: [...] }]
export const filterPanel = (groups, panelId, cls) =>
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

// Marks the pinned Build Log post on Home and on the Build Log page.
export const PIN_ICON =
  '<svg class="pin-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>' +
  '</svg>';

export const toggleIn = (list, value) => (list.indexOf(value) >= 0 ? list.filter((x) => x !== value) : list.concat([value]));

// Re-render helper that keeps keyboard focus on the same control after innerHTML replaces it.
export const rerender = (root, html) => {
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
