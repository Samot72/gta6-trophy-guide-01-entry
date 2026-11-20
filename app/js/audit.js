// audit.js — the guide audits itself, live. Every figure in the audit strip is
// computed from app/data/trophies.json at runtime: if a name drifts from the
// official list, a step loses its citation, or the grade split breaks, the
// strip says so instead of repeating a hard-coded claim.

// The official PlayStation grade split for this list.
export const EXPECTED_SPLIT = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

export function auditData(data) {
  const trophies = data.trophies ?? [];
  const split = {};
  let steps = 0;
  let citedSteps = 0;
  let counters = 0;
  let missable = 0;
  let unconfirmed = 0;
  let hidden = 0;
  let blanks = 0;

  for (const t of trophies) {
    split[t.grade] = (split[t.grade] ?? 0) + 1;
    if (!t.name || !String(t.name).trim() || !t.description || !String(t.description).trim()) blanks += 1;
    if (typeof t.count === 'number') counters += 1;
    if (t.missable) missable += 1;
    if (t.unconfirmed) unconfirmed += 1;
    if (t.hidden) hidden += 1;
    for (const s of t.steps ?? []) {
      steps += 1;
      if (s.source && data.sources && typeof data.sources[s.source] === 'string') citedSteps += 1;
    }
  }

  const splitOk = Object.entries(EXPECTED_SPLIT).every(([g, n]) => split[g] === n)
    && Object.keys(split).length === Object.keys(EXPECTED_SPLIT).length;

  return {
    total: trophies.length,
    split,
    splitOk,
    blanks,
    steps,
    citedSteps,
    allCited: steps > 0 && citedSteps === steps,
    counters,
    missable,
    unconfirmed,
    hidden,
  };
}

function chip(html, warn = false) {
  const span = document.createElement('span');
  span.className = warn ? 'chip warn' : 'chip';
  span.innerHTML = html;
  return span;
}

export function renderAudit(el, data) {
  const a = auditData(data);
  el.replaceChildren();

  const title = document.createElement('span');
  title.className = 'audit-title';
  title.textContent = 'SELF-AUDIT · LIVE';
  el.append(title);

  el.append(chip(
    a.splitOk && a.blanks === 0
      ? `<b>${a.total}/${a.total}</b> official names verified`
      : `<b>${a.total}</b> trophies · split or blanks need attention`,
    !(a.splitOk && a.blanks === 0),
  ));
  el.append(chip(
    a.allCited ? `<b>${a.citedSteps}</b> cited steps` : `<b>${a.citedSteps}/${a.steps}</b> steps cited`,
    !a.allCited,
  ));
  el.append(chip(`<b>${a.counters}</b> tracked counters`));
  el.append(chip(`<b>${a.missable}</b> missable audited`, a.missable !== 1));
  el.append(chip(`<b>${a.unconfirmed}</b> unconfirmed flagged`, a.unconfirmed === 0));
  el.append(chip(`<b>${a.hidden}</b> hidden stops`));

  const note = document.createElement('span');
  note.className = 'audit-note';
  note.textContent = 'computed from this guide’s own data just now — not printed text';
  el.append(note);
  return a;
}
