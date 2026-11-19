// Leonida Trophy Guide — an offline tracker for the 55 GTA VI PlayStation 5 trophies.
// State lives in localStorage; progress exports to and imports from a JSON file.
// The app loads only its own files: style.css, this module and data/trophies.json.

const STORAGE_KEY = 'leonida-trophy-guide-v1';
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

const listEl = document.getElementById('trophy-list');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade-filter');
const spoilersEl = document.getElementById('spoilers');
const noResultsEl = document.getElementById('no-results');

const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
const state = {
  earned: new Set(saved.earned ?? []),
  spoilers: saved.spoilers ?? false,
  filter: 'all',
  grade: 'all',
  query: '',
  view: 'tracker',
  selected: null,
};

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...state.earned], spoilers: state.spoilers }));
}

function isSpoilered(t) {
  return state.spoilers && t.kind === 'story' && !state.earned.has(t.id);
}

function matchesFilter(t) {
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.query && !`${t.name} ${t.description}`.toLowerCase().includes(state.query)) return false;
  switch (state.filter) {
    case 'all': return true;
    case 'earned': return state.earned.has(t.id);
    case 'missing': return !state.earned.has(t.id);
    case 'missable': return t.missable;
    default: return t.kind === state.filter;
  }
}

function badge(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls ?? ''}`;
  span.textContent = text;
  return span;
}

function renderProgress() {
  const total = trophies.length;
  const done = state.earned.size;
  document.getElementById('earned-count').textContent = String(done);
  document.getElementById('earned-pct').textContent = `${Math.round((done / total) * 100)}%`;
  document.getElementById('progress-bar').style.width = `${(done / total) * 100}%`;
  const counts = document.getElementById('grade-counts');
  counts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => state.earned.has(t.id)).length;
    const span = document.createElement('span');
    span.innerHTML = `${grade}: <b>${got}/${all.length}</b>`;
    counts.append(span);
  }
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!matchesFilter(t)) continue;
    shown += 1;
    const spoilered = isSpoilered(t);
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = `trophy grade-${t.grade}${state.earned.has(t.id) ? ' earned' : ''}${state.selected === t.id ? ' selected' : ''}${spoilered ? ' spoilered' : ''}`;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => toggleEarned(t.id));

    const body = document.createElement('div');
    body.className = 'body';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = spoilered ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = spoilered ? 'Name and description hidden until earned.' : t.description;
    const badges = document.createElement('div');
    badges.className = 'badges';
    badges.append(badge(t.grade, `grade-${t.grade}`), badge(t.kind));
    if (t.hidden) badges.append(badge('Hidden on PSN', 'hidden-badge'));
    if (t.missable) badges.append(badge('Missable', 'missable'));
    if (state.earned.has(t.id)) badges.append(badge('Earned'));
    body.append(name, desc, badges);
    if (spoilered) {
      const note = document.createElement('div');
      note.className = 'spoiler-note';
      note.textContent = 'Spoiler setting is on: tick it earned to reveal.';
      body.append(note);
    }
    row.append(box, body);
    row.addEventListener('click', () => selectTrophy(t.id));
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter') selectTrophy(t.id); });
    li.append(row);
    listEl.append(li);
  }
  noResultsEl.hidden = shown > 0;
}

function sourceLink(key) {
  const s = doc.sources[key];
  if (!s) return null;
  const a = document.createElement('a');
  a.href = s.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = s.name;
  return a;
}

function renderDetail() {
  const t = byId.get(state.selected);
  detailEl.replaceChildren();
  if (!t) {
    const hint = document.createElement('p');
    hint.className = 'detail-hint';
    hint.textContent = 'Pick a trophy to read its guide: what to do, where and how, when it can be missed — and the sources each fact comes from.';
    detailEl.append(hint);
    return;
  }
  const spoilered = isSpoilered(t);
  const h = document.createElement('h2');
  h.textContent = spoilered ? 'Hidden story trophy' : t.name;
  const badges = document.createElement('div');
  badges.className = 'badges';
  badges.append(badge(t.grade, `grade-${t.grade}`), badge(t.kind));
  if (t.hidden) badges.append(badge('Hidden on PSN', 'hidden-badge'));
  if (t.missable) badges.append(badge('Missable', 'missable'));
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = spoilered ? 'Official name and description hidden by the spoiler setting until this trophy is earned.' : `Official description: “${t.description}”`;
  detailEl.append(h, badges, official);

  if (t.missable && t.missableNote) {
    const warn = document.createElement('div');
    warn.className = 'warn-box';
    warn.textContent = `Missable warning: ${t.missableNote}`;
    detailEl.append(warn);
  }
  const gh = document.createElement('h3');
  gh.textContent = 'Guide (in our own words)';
  const gp = document.createElement('p');
  gp.textContent = spoilered ? 'The guide is hidden too — it names the mission this trophy belongs to.' : t.guide;
  detailEl.append(gh, gp);

  if (!spoilered) {
    const sh = document.createElement('h3');
    sh.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const key of t.sources) {
      const link = sourceLink(key);
      if (!link) continue;
      const li = document.createElement('li');
      li.append(link);
      ul.append(li);
    }
    detailEl.append(sh, ul);
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = state.earned.has(t.id) ? 'earn-btn undo' : 'earn-btn';
  btn.textContent = state.earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned';
  btn.addEventListener('click', () => toggleEarned(t.id));
  detailEl.append(btn);
}

function renderRoadmap() {
  const facts = document.getElementById('roadmap-facts');
  facts.textContent = `${doc.roadmap.difficulty} · ${doc.roadmap.hours} · Playthroughs needed: ${doc.roadmap.playthroughs}.`;
  const steps = document.getElementById('roadmap-steps');
  steps.replaceChildren();
  for (const step of doc.roadmap.steps) {
    const div = document.createElement('div');
    div.className = 'step';
    const h = document.createElement('h3');
    h.textContent = step.title;
    const p = document.createElement('p');
    p.textContent = step.text;
    div.append(h, p);
    steps.append(div);
  }
  const miss = document.getElementById('missable-list');
  miss.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const div = document.createElement('div');
    div.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = `${t.name} — potentially missable`;
    const p = document.createElement('p');
    p.textContent = t.guide;
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.className = 'earn-btn';
    jump.textContent = 'Open in the tracker';
    jump.addEventListener('click', () => {
      state.view = 'tracker';
      state.selected = t.id;
      render();
      window.scrollTo({ top: 0 });
    });
    div.append(h, p, jump);
    miss.append(div);
  }
}

function render() {
  renderProgress();
  renderList();
  renderDetail();
  document.getElementById('view-tracker').hidden = state.view !== 'tracker';
  document.getElementById('view-roadmap').hidden = state.view !== 'roadmap';
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.view === state.view);
  }
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  persist();
  render();
}

function selectTrophy(id) {
  state.selected = id;
  render();
}

function exportProgress() {
  const payload = JSON.stringify({ game: doc.game, platform: doc.platform, earned: [...state.earned], exportedAt: new Date().toISOString() }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  const data = JSON.parse(await file.text());
  const raw = Array.isArray(data) ? data : data.earned ?? [];
  const ids = new Set();
  for (const item of raw) {
    if (typeof item === 'number' && byId.has(item)) ids.add(item);
    if (typeof item === 'string') {
      const found = trophies.find((t) => t.name === item);
      if (found) ids.add(found.id);
    }
  }
  state.earned = ids;
  persist();
  render();
}

document.getElementById('filter-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.filter = chip.dataset.filter;
  for (const c of document.querySelectorAll('.chip')) c.classList.toggle('active', c === chip);
  render();
});
gradeEl.addEventListener('change', () => { state.grade = gradeEl.value; render(); });
searchEl.addEventListener('input', () => { state.query = searchEl.value.trim().toLowerCase(); render(); });
spoilersEl.checked = state.spoilers;
spoilersEl.addEventListener('change', () => { state.spoilers = spoilersEl.checked; persist(); render(); });
document.getElementById('export-btn').addEventListener('click', exportProgress);
document.getElementById('import-file').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); });
document.getElementById('reset-btn').addEventListener('click', () => { state.earned = new Set(); persist(); render(); });
for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => { state.view = tab.dataset.view; render(); });
}
document.getElementById('provenance').textContent = doc.provenance;

// Optional view state in the URL (used for the entry's screenshots; harmless in normal use):
// ?view=roadmap, ?filter=story, ?grade=silver, ?open=<id>, ?spoilers=1, ?earned=2,3,15
const params = new URLSearchParams(location.search);
if (params.get('view') === 'roadmap') state.view = 'roadmap';
if (params.get('spoilers') === '1') { state.spoilers = true; spoilersEl.checked = true; }
if (params.get('earned')) {
  state.earned = new Set(params.get('earned').split(',').map(Number).filter((n) => byId.has(n)));
}
if (params.get('filter')) {
  state.filter = params.get('filter');
  for (const c of document.querySelectorAll('.chip')) c.classList.toggle('active', c.dataset.filter === state.filter);
}
if (params.get('grade')) { state.grade = params.get('grade'); gradeEl.value = state.grade; }
if (params.get('open')) state.selected = Number(params.get('open'));

renderRoadmap();
render();
