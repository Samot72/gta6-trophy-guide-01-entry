// departure-board.js — the whole line as a station board: every stop in earn
// order with its stage, grade, kind, tracker progress and status. Filters from
// the toolbar narrow the board; spoiler fog hides unearned story names here
// too. Clicking a row opens that stop's guide.

import { isEarned, getCount } from './tracker.js';
import { isFogged, formatCount } from './stops.js';
import { STAGE_COLORS } from './route-map.js';

function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderBoard(container, data, view) {
  container.replaceChildren();
  const table = h('table', 'board');
  const head = h('tr', '');
  for (const label of ['#', 'Stop', 'Stage', 'Grade', 'Kind', 'Tracker', 'Status']) {
    head.append(h('th', '', label));
  }
  const thead = h('thead', '');
  thead.append(head);
  table.append(thead);

  const tbody = h('tbody', '');
  for (const t of data.trophies) {
    if (view.matches && !view.matches.has(t.id)) continue;
    const earned = isEarned(view.progress, t.id);
    const fogged = isFogged(t, view.progress, view.fog);
    const tr = h('tr', `row${earned ? ' earned' : ''}${view.selectedId === t.id ? ' selected' : ''}`);
    tr.addEventListener('click', () => view.onSelect(t.id));

    tr.append(h('td', 'num', String(t.id)));

    const nameTd = h('td', 'name');
    if (fogged) {
      nameTd.append(h('span', 'fog-name', 'Hidden trophy — spoiler fogged'));
    } else {
      nameTd.append(document.createTextNode(t.name));
      if (t.missable) nameTd.append(h('span', 'mini-flag mf-miss', 'MISSABLE'));
      if (t.unconfirmed) nameTd.append(h('span', 'mini-flag mf-unc', 'UNCONFIRMED'));
      if (t.hidden) nameTd.append(h('span', 'mini-flag mf-hid', 'HIDDEN'));
    }
    tr.append(nameTd);

    const stageTd = h('td', '');
    const dot = h('span', '', '● ');
    dot.style.color = STAGE_COLORS[t.stage - 1];
    stageTd.append(dot, document.createTextNode(data.stages[t.stage - 1].name));
    tr.append(stageTd);

    tr.append(h('td', '', t.grade));
    tr.append(h('td', '', t.kind));
    tr.append(h('td', 'prog', typeof t.count === 'number' ? `${formatCount(getCount(view.progress, t))} / ${formatCount(t.count)}` : '—'));
    tr.append(h('td', `status-dot ${earned ? 'yes' : 'no'}`, earned ? '✓ earned' : '· missing'));
    tbody.append(tr);
  }
  table.append(tbody);
  container.append(table);
}
