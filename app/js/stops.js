// stops.js — one stop, in full: the official name and description, the guide in
// our own words, the step-by-step with a citation on every step, the tracked
// counter where PlayStation keeps one, and the earn button. Spoiler fog hides
// unearned story stops here, on the line, and on the departure board.

import { isEarned, getCount } from './tracker.js';
import { STAGE_COLORS } from './route-map.js';

// Fog covers hidden STORY trophies only: strand and side names stay readable,
// but the story's shape stays secret until the rider earns each stop.
export function isFogged(trophy, progress, fogOn) {
  return Boolean(fogOn && trophy.hidden && trophy.kind === 'story' && !isEarned(progress, trophy.id));
}

export function displayName(trophy, progress, fogOn) {
  return isFogged(trophy, progress, fogOn) ? 'Hidden Trophy' : trophy.name;
}

export function formatCount(n) {
  return n.toLocaleString('en-US');
}

function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function flagRow(t) {
  const row = h('div', 'flag-row');
  row.append(h('span', `flag grade-${t.grade}`, t.grade.toUpperCase()));
  row.append(h('span', 'flag', t.kind.toUpperCase()));
  if (t.hidden) row.append(h('span', 'flag hidden-flag', 'HIDDEN'));
  if (t.missable) row.append(h('span', 'flag missable', '⚠ MISSABLE'));
  if (t.unconfirmed) row.append(h('span', 'flag unconfirmed', 'UNCONFIRMED'));
  return row;
}

function counterBox(data, t, progress, handlers) {
  const box = h('div', 'counter-box');
  const value = getCount(progress, t);
  const top = h('div', 'cb-top');
  top.append(h('span', 'cb-label', `PlayStation tracker · ${t.countLabel}`));
  const val = h('span', 'cb-value');
  val.append(document.createTextNode(formatCount(value)));
  const target = h('span', '', ` / ${formatCount(t.count)}`);
  val.append(target);
  top.append(val);
  box.append(top);

  const bar = h('div', 'counter-bar');
  const fill = h('div', 'counter-fill');
  fill.style.width = `${Math.min(100, (value / t.count) * 100)}%`;
  bar.append(fill);
  box.append(bar);

  const btns = h('div', 'counter-btns');
  const steps = t.count >= 1000 ? [-100, -10, -1, 1, 10, 100] : t.count >= 50 ? [-10, -1, 1, 10] : [-1, 1];
  for (const d of steps) {
    const b = h('button', '', d > 0 ? `+${d}` : `${d}`);
    b.type = 'button';
    b.addEventListener('click', () => handlers.onCount(t, value + d));
    btns.append(b);
  }
  const done = h('button', '', 'Complete');
  done.type = 'button';
  done.addEventListener('click', () => handlers.onCount(t, t.count));
  btns.append(done);
  box.append(btns);
  return box;
}

function stepsList(data, t) {
  const ol = h('ol', 'steps');
  for (const s of t.steps) {
    const li = h('li', '', s.text);
    const cite = h('span', 'cite');
    cite.append(document.createTextNode('Source: '));
    const url = data.sources[s.source];
    if (url) {
      const a = h('a', '', `${s.source} ↗`);
      a.href = url;
      a.target = '_blank';
      a.rel = 'noreferrer';
      cite.append(a);
    } else {
      cite.append(document.createTextNode(s.source));
    }
    li.append(cite);
    ol.append(li);
  }
  return ol;
}

export function renderStopPanel(el, data, trophy, progress, view, handlers) {
  const t = trophy;
  el.replaceChildren();
  const stage = data.stages[t.stage - 1];
  const fogged = isFogged(t, progress, view.fog);
  const earned = isEarned(progress, t.id);

  const kicker = h('div', 'stop-kicker');
  const badge = h('span', 'stop-badge', fogged ? '?' : String(t.id));
  badge.style.borderColor = STAGE_COLORS[t.stage - 1];
  kicker.append(badge);
  kicker.append(h('span', '', `STOP ${t.id} OF 55 · STAGE ${t.stage} — ${stage.name.toUpperCase()}`));
  el.append(kicker);

  el.append(h('h2', fogged ? 'fogged-name' : '', fogged ? 'Hidden Trophy' : t.name));

  if (fogged) {
    el.append(h('p', 'guide-text',
      'Spoiler fog is on: this story stop’s name, description and steps stay hidden until you earn it in game. Mark it earned here once it pops — or switch spoiler fog off in the toolbar to reveal everything.'));
  } else {
    el.append(h('p', 'official-desc', t.description));
    el.append(flagRow(t));
    el.append(h('p', 'guide-text', t.guide));

    if (t.missable) {
      const note = h('div', 'missable-note');
      const b = h('b', '', '⚠ The one missable on the line. ');
      note.append(b, document.createTextNode('The Chapter 1 balcony meditation cannot be replayed — there is no mission replay. Do step 1 before Chapter 1 ends.'));
      el.append(note);
    }
    if (t.unconfirmed) {
      const note = h('div', 'unconfirmed-note');
      const b = h('b', '', 'Unconfirmed trigger. ');
      note.append(b, document.createTextNode('No launch-week source has verified how this trophy is earned, so the steps below say what is known — and invent nothing.'));
      el.append(note);
    }
    if (typeof t.count === 'number') el.append(counterBox(data, t, progress, handlers));
    el.append(stepsList(data, t));
  }

  const row = h('div', 'earn-row');
  const earnBtn = h('button', `earn-btn${earned ? ' is-earned' : ''}`, earned ? '✓ Earned — undo' : 'Mark stop earned');
  earnBtn.type = 'button';
  earnBtn.addEventListener('click', () => handlers.onToggle(t));
  row.append(earnBtn);

  const prev = h('button', 'nav-btn', '← Prev stop');
  prev.type = 'button';
  prev.disabled = t.id <= 1;
  prev.addEventListener('click', () => handlers.onNav(t.id - 1));
  const next = h('button', 'nav-btn', 'Next stop →');
  next.type = 'button';
  next.disabled = t.id >= data.trophies.length;
  next.addEventListener('click', () => handlers.onNav(t.id + 1));
  row.append(prev, next);
  el.append(row);
}
