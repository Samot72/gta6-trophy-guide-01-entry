// route-map.js — the Platinum Line drawn as a transit map. One SVG, two views:
// the full line (7 stage rows, snaking left-right like a tube map) and a zoomed
// single-stage view with room for full stop names. Stops are numbered in earn
// order; earned stops fill with their stage colour, fogged story stops hide
// their names until earned, and the one missable stop carries a warning dot.

import { isEarned } from './tracker.js';
import { isFogged } from './stops.js';

export const STAGE_COLORS = ['#ffd23f', '#ff7b54', '#ff4d8d', '#b388ff', '#4dd0e1', '#69f0ae', '#ffe9a8'];

const SVGNS = 'http://www.w3.org/2000/svg';
const WIDTH = 920;

function svgEl(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (parent) parent.append(node);
  return node;
}

function svgText(parent, x, y, text, attrs = {}) {
  const node = svgEl('text', { x, y, ...attrs }, parent);
  node.textContent = text;
  return node;
}

export function shortLabel(name) {
  return name.length > 16 ? `${name.slice(0, 15).trimEnd()}…` : name;
}

export function missableInStage(data, stageN) {
  return data.trophies.find((t) => t.stage === stageN && t.missable) ?? null;
}

// Serpentine layout: stage rows alternate direction so the line snakes.
// A single-stop row (the terminus) starts at the left, so the final connector
// drops straight down instead of slashing across the row above.
function layoutLine(data) {
  const left = 152;
  const right = 894;
  const pos = new Map();
  data.stages.forEach((stage, i) => {
    const y = 62 + i * 62;
    const stops = data.trophies.filter((t) => t.stage === stage.n);
    const ltr = i % 2 === 0;
    stops.forEach((t, j) => {
      const frac = stops.length === 1 ? 0 : j / (stops.length - 1);
      const x = ltr ? left + frac * (right - left) : right - frac * (right - left);
      pos.set(t.id, { x, y, rowIndex: j });
    });
  });
  return pos;
}

function drawStop(g, t, x, y, view, { big = false } = {}) {
  const color = STAGE_COLORS[t.stage - 1];
  const earned = isEarned(view.progress, t.id);
  const fogged = isFogged(t, view.progress, view.fog);
  const selected = view.selectedId === t.id;
  const dim = view.matches && !view.matches.has(t.id);
  const r = t.grade === 'platinum' ? (big ? 24 : 14.5) : big ? 19 : 10.5;

  const grp = svgEl('g', { class: `stop-dot${earned ? ' earned' : ''}${fogged ? ' fogged' : ''}${dim ? ' dim' : ''}` }, g);
  grp.addEventListener('click', () => view.onSelect(t.id));

  if (selected) svgEl('circle', { cx: x, cy: y, r: r + 6.5, fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.95 }, grp);
  if (t.grade === 'platinum') svgEl('circle', { cx: x, cy: y, r: r + 4.5, fill: 'none', stroke: color, 'stroke-width': 1.6, opacity: 0.7 }, grp);
  svgEl('circle', { class: 'ring', cx: x, cy: y, r, stroke: fogged ? '#5d6690' : color, fill: earned ? color : '#0a0d20' }, grp);

  const label = fogged ? '?' : earned ? '✓' : String(t.id);
  svgText(grp, x, y + (big ? 5 : 3.5), label, {
    class: 'num', 'font-size': big ? 14 : 9.5, fill: earned ? '#0a0d20' : fogged ? '#5d6690' : '#eef1ff',
  });

  if (t.missable && !earned) {
    svgEl('circle', { cx: x + r - 1, cy: y - r + 1, r: big ? 8 : 5.5, fill: '#ff5d73', stroke: '#0a0d20', 'stroke-width': 1.4 }, grp);
    svgText(grp, x + r - 1, y - r + (big ? 4 : 3), '!', { class: 'num', 'font-size': big ? 10 : 8, fill: '#ffffff' });
  }
  return grp;
}

function drawFullLine(svg, data, view) {
  const pos = layoutLine(data);
  const byId = new Map(data.trophies.map((t) => [t.id, t]));

  // Track segments, coloured by the stage of the stop they leave.
  for (let id = 1; id < data.trophies.length; id += 1) {
    const a = pos.get(id);
    const b = pos.get(id + 1);
    svgEl('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: STAGE_COLORS[byId.get(id).stage - 1], 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.85,
    }, svg);
  }

  // Stage tags down the left edge; clicking one zooms into that stage.
  data.stages.forEach((stage, i) => {
    const y = 62 + i * 62;
    const tag = svgEl('g', { class: 'stage-tag' }, svg);
    tag.addEventListener('click', () => view.onZoom(stage.n));
    svgEl('rect', { x: 4, y: y - 17, width: 128, height: 34, rx: 7, fill: '#161b36', stroke: STAGE_COLORS[i], 'stroke-width': 1.6 }, tag);
    svgText(tag, 12, y - 2, `STAGE ${stage.n}`, { 'font-size': 8.5, fill: '#9aa3c7', 'letter-spacing': '1.5' });
    svgText(tag, 12, y + 11, stage.name.toUpperCase(), { 'font-size': 10.5, fill: '#eef1ff' });
  });

  // Stops with alternating labels above and below the track.
  for (const t of data.trophies) {
    const { x, y, rowIndex } = pos.get(t.id);
    const grp = drawStop(svg, t, x, y, view);
    const fogged = isFogged(t, view.progress, view.fog);
    const above = t.stage === 7 ? true : rowIndex % 2 === 0;
    const name = fogged ? 'Hidden trophy' : shortLabel(t.name);
    // Anchor edge labels inward so nothing clips at the map's borders.
    const anchor = x < 280 ? 'start' : x > 660 ? 'end' : 'middle';
    svgText(grp, x, above ? y - 19 : y + 27, name, {
      class: 'lab', 'font-size': 10, 'text-anchor': anchor,
      fill: view.selectedId === t.id ? '#ffffff' : '#aab3d9',
      'font-weight': view.selectedId === t.id ? 700 : 400,
    });
  }
}

function wrapName(name, perLine = 13) {
  const words = name.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > perLine && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function drawStageZoom(svg, data, view) {
  const stage = data.stages[view.zoomStage - 1];
  const stops = data.trophies.filter((t) => t.stage === stage.n);
  const perRow = 8;
  const rows = Math.ceil(stops.length / perRow);

  for (let i = 1; i < stops.length; i += 1) {
    const a = zoomPos(i - 1, perRow);
    const b = zoomPos(i, perRow);
    svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: STAGE_COLORS[stage.n - 1], 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.85 }, svg);
  }
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${rows === 1 ? 218 : 336}`);

  for (const [i, t] of stops.entries()) {
    const { x, y } = zoomPos(i, perRow);
    const grp = drawStop(svg, t, x, y, view, { big: true });
    const fogged = isFogged(t, view.progress, view.fog);
    const lines = fogged ? ['Hidden', 'trophy'] : wrapName(t.name);
    lines.forEach((line, li) => {
      svgText(grp, x, y + 38 + li * 14, line, {
        class: 'lab', 'font-size': 12.5, 'text-anchor': 'middle',
        fill: view.selectedId === t.id ? '#ffffff' : '#c6cdea', 'font-weight': 600,
      });
    });
    const meta = fogged ? 'spoiler fogged' : `${t.grade} · ${t.kind}${t.missable ? ' · MISSABLE' : ''}${t.unconfirmed ? ' · UNCONFIRMED' : ''}`;
    svgText(grp, x, y + 38 + lines.length * 14 + 2, meta, {
      class: 'lab', 'font-size': 9.5, 'text-anchor': 'middle',
      fill: t.missable ? '#ff5d73' : '#5d6690', 'font-family': 'ui-monospace, monospace',
    });
  }
}

function zoomPos(i, perRow) {
  const row = Math.floor(i / perRow);
  const inRow = i % perRow;
  const x = 70 + inRow * 111 + (row % 2 === 1 ? 0 : 0);
  return { x, y: 66 + row * 128 };
}

export function renderRouteMap(container, data, view) {
  container.replaceChildren();
  const svg = svgEl('svg', { viewBox: `0 0 ${WIDTH} 472`, role: 'img', 'aria-label': 'Route 55 transit map of all 55 trophies' }, container);
  if (view.zoomStage > 0) drawStageZoom(svg, data, view);
  else drawFullLine(svg, data, view);
}
