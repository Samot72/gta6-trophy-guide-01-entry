// app.js — boots the line: loads the data, restores (or seeds) progress, wires
// the toolbar filters, and keeps the map, the stop panel, the departure board,
// the journey header and the audit strip in sync. URL parameters (?stop=,
// ?zoom=, ?fog=, ?seed=, ?focus=) make any view reproducible — that is how the
// screenshots in /screenshots were framed.

import { loadProgress, saveProgress, isEarned, setEarned, setCount, journeyStats, exportProgress, parseImport } from './tracker.js';
import { renderAudit } from './audit.js';
import { renderRouteMap, STAGE_COLORS, missableInStage } from './route-map.js';
import { renderStopPanel } from './stops.js';
import { renderBoard } from './departure-board.js';

const params = new URLSearchParams(location.search);

// Demo states used to frame the screenshots (and handy for trying the tracker).
function seedProgress(name) {
  if (name === 'mid') {
    return {
      earned: { 1: true, 2: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true },
      counts: { 3: 6, 8: 3, 9: 4, 22: 40000 },
    };
  }
  if (name === 'late') {
    const earned = {};
    for (let id = 1; id <= 37; id += 1) earned[id] = true;
    return {
      earned,
      counts: { 22: 205000, 40: 62, 41: 173, 42: 31, 43: 9, 44: 13, 45: 7, 46: 34, 47: 64, 48: 57, 49: 1, 51: 6, 53: 42000, 54: 212 },
    };
  }
  return null;
}

const data = await (await fetch('data/trophies.json')).json();
const seeded = seedProgress(params.get('seed'));
let progress = seeded ?? loadProgress();
if (!seeded) saveProgress(progress);

const view = {
  progress,
  fog: params.get('fog') ? params.get('fog') !== '0' : true,
  selectedId: Number(params.get('stop')) || 3,
  zoomStage: Number(params.get('zoom')) || 0,
  filters: {
    stage: params.get('stage') || 'all',
    kind: params.get('kind') || 'all',
    grade: params.get('grade') || 'all',
    status: params.get('status') || 'all',
    missable: params.get('missable') === '1',
  },
  matches: null,
};

if (params.get('focus')) document.body.classList.add('focus');

const byId = new Map(data.trophies.map((t) => [t.id, t]));
const els = {
  audit: document.getElementById('auditStrip'),
  journeyText: document.getElementById('journeyText'),
  journeyPct: document.getElementById('journeyPct'),
  journeyFill: document.getElementById('journeyFill'),
  gradeCounts: document.getElementById('gradeCounts'),
  mapTitle: document.getElementById('mapTitle'),
  zoomOut: document.getElementById('zoomOut'),
  routeMap: document.getElementById('routeMap'),
  stagePanel: document.getElementById('stagePanel'),
  stopPanel: document.getElementById('stopPanel'),
  board: document.getElementById('board'),
  matchCount: document.getElementById('matchCount'),
  fStage: document.getElementById('fStage'),
  fKind: document.getElementById('fKind'),
  fGrade: document.getElementById('fGrade'),
  fStatus: document.getElementById('fStatus'),
  fMissable: document.getElementById('fMissable'),
  fFog: document.getElementById('fFog'),
};

function computeMatches() {
  const f = view.filters;
  const set = new Set();
  for (const t of data.trophies) {
    if (f.stage !== 'all' && t.stage !== Number(f.stage)) continue;
    if (f.kind !== 'all' && t.kind !== f.kind) continue;
    if (f.grade !== 'all' && t.grade !== f.grade) continue;
    if (f.status === 'earned' && !isEarned(progress, t.id)) continue;
    if (f.status === 'missing' && isEarned(progress, t.id)) continue;
    if (f.missable && !t.missable) continue;
    set.add(t.id);
  }
  return set;
}

function renderJourney() {
  const s = journeyStats(data, progress);
  els.journeyText.textContent = `${s.earnedTotal} of ${s.total} stops earned`;
  els.journeyPct.textContent = `${s.pct}% of the journey`;
  els.journeyFill.style.width = `${s.pct}%`;
  els.gradeCounts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const [e, tot] = s.perGrade[grade] ?? [0, 0];
    const span = document.createElement('span');
    const b = document.createElement('b');
    b.textContent = `${e}/${tot}`;
    span.append(b, document.createTextNode(` ${grade}`));
    els.gradeCounts.append(span);
  }
}

function renderStageChips() {
  els.stagePanel.replaceChildren();
  for (const stage of data.stages) {
    const stops = data.trophies.filter((t) => t.stage === stage.n);
    const earned = stops.filter((t) => isEarned(progress, t.id)).length;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'stage-chip';
    chip.style.borderLeftColor = STAGE_COLORS[stage.n - 1];
    const name = document.createElement('span');
    name.className = 'sc-name';
    name.textContent = `${stage.n} · ${stage.name}`;
    const sub = document.createElement('span');
    sub.className = 'sc-sub';
    sub.textContent = stage.sub;
    const prog = document.createElement('span');
    prog.className = 'sc-prog';
    const miss = missableInStage(data, stage.n);
    prog.textContent = `${earned}/${stops.length} earned${miss && !isEarned(progress, miss.id) ? ' · ⚠ missable aboard' : ''}`;
    chip.append(name, sub, prog);
    chip.addEventListener('click', () => { view.zoomStage = stage.n; renderAll(); });
    els.stagePanel.append(chip);
  }
}

function renderMapHead() {
  if (view.zoomStage > 0) {
    const stage = data.stages[view.zoomStage - 1];
    els.mapTitle.textContent = `Stage ${stage.n} — ${stage.name} · ${stage.sub}`;
    els.zoomOut.hidden = false;
  } else {
    els.mapTitle.textContent = 'The full line — 7 stages, 55 stops';
    els.zoomOut.hidden = true;
  }
}

const handlers = {
  onSelect(id) { view.selectedId = id; renderAll(); },
  onZoom(stageN) { view.zoomStage = stageN; renderAll(); },
  onNav(id) { if (byId.has(id)) { view.selectedId = id; renderAll(); } },
  onToggle(t) {
    setEarned(progress, t.id, !isEarned(progress, t.id));
    saveProgress(progress);
    renderAll();
  },
  onCount(t, value) {
    const v = setCount(progress, t, value);
    if (v >= t.count) setEarned(progress, t.id, true);
    saveProgress(progress);
    renderAll();
  },
};

function renderAll() {
  view.matches = computeMatches();
  const filtering = view.filters.stage !== 'all' || view.filters.kind !== 'all' || view.filters.grade !== 'all'
    || view.filters.status !== 'all' || view.filters.missable;
  els.matchCount.textContent = filtering ? `${view.matches.size} of 55 stops match` : '';
  renderJourney();
  renderMapHead();
  renderRouteMap(els.routeMap, data, { ...view, onSelect: handlers.onSelect, onZoom: handlers.onZoom });
  renderStageChips();
  renderStopPanel(els.stopPanel, data, byId.get(view.selectedId), progress, view, handlers);
  renderBoard(els.board, data, { ...view, onSelect: handlers.onSelect });
}

// ---- toolbar wiring ----
for (const stage of data.stages) {
  const opt = document.createElement('option');
  opt.value = String(stage.n);
  opt.textContent = `${stage.n} · ${stage.name}`;
  els.fStage.append(opt);
}
for (const kind of [...new Set(data.trophies.map((t) => t.kind))]) {
  const opt = document.createElement('option');
  opt.value = kind;
  opt.textContent = kind;
  els.fKind.append(opt);
}
els.fStage.value = view.filters.stage;
els.fKind.value = view.filters.kind;
els.fGrade.value = view.filters.grade;
els.fStatus.value = view.filters.status;
els.fMissable.checked = view.filters.missable;
els.fFog.checked = view.fog;

els.fStage.addEventListener('change', () => { view.filters.stage = els.fStage.value; renderAll(); });
els.fKind.addEventListener('change', () => { view.filters.kind = els.fKind.value; renderAll(); });
els.fGrade.addEventListener('change', () => { view.filters.grade = els.fGrade.value; renderAll(); });
els.fStatus.addEventListener('change', () => { view.filters.status = els.fStatus.value; renderAll(); });
els.fMissable.addEventListener('change', () => { view.filters.missable = els.fMissable.checked; renderAll(); });
els.fFog.addEventListener('change', () => { view.fog = els.fFog.checked; renderAll(); });
els.zoomOut.addEventListener('click', () => { view.zoomStage = 0; renderAll(); });

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([exportProgress(progress)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'route55-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  const parsed = parseImport(await file.text());
  if (parsed) {
    progress = parsed;
    view.progress = progress;
    saveProgress(progress);
    renderAll();
  }
  ev.target.value = '';
});

renderAudit(els.audit, data);
renderAll();
