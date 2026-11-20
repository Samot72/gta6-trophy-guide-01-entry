// tracker.js — the rider's progress: which stops are earned and how far each
// tracked counter has climbed. State lives in localStorage only; export and
// import move it between browsers as plain JSON. No DOM in here.

const STORAGE_KEY = 'route55-progress-v1';

export function emptyProgress() {
  return { earned: {}, counts: {} };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyProgress();
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: the line still works for this session.
  }
}

export function isEarned(progress, id) {
  return progress.earned[id] === true;
}

export function setEarned(progress, id, on) {
  if (on) progress.earned[id] = true;
  else delete progress.earned[id];
}

export function getCount(progress, trophy) {
  const n = progress.counts[trophy.id];
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function setCount(progress, trophy, value) {
  const clamped = Math.max(0, Math.min(trophy.count ?? 0, Math.floor(value) || 0));
  if (clamped === 0) delete progress.counts[trophy.id];
  else progress.counts[trophy.id] = clamped;
  return clamped;
}

// Journey summary for the header: total progress plus earned/total per grade.
export function journeyStats(data, progress) {
  const perGrade = {};
  let earnedTotal = 0;
  for (const t of data.trophies) {
    const slot = (perGrade[t.grade] ??= [0, 0]);
    slot[1] += 1;
    if (isEarned(progress, t.id)) {
      slot[0] += 1;
      earnedTotal += 1;
    }
  }
  const total = data.trophies.length;
  return {
    earnedTotal,
    total,
    pct: total === 0 ? 0 : Math.round((earnedTotal / total) * 100),
    perGrade,
  };
}

// Export: a small, human-readable JSON document the rider owns.
export function exportProgress(progress) {
  return JSON.stringify(
    { app: 'route55', version: 1, exportedAt: new Date().toISOString(), earned: progress.earned, counts: progress.counts },
    null,
    2,
  );
}

// Import: accept only the shape exportProgress produces; anything else is rejected.
export function parseImport(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    const clean = emptyProgress();
    if (parsed.earned && typeof parsed.earned === 'object') {
      for (const [k, v] of Object.entries(parsed.earned)) if (v === true) clean.earned[k] = true;
    }
    if (parsed.counts && typeof parsed.counts === 'object') {
      for (const [k, v] of Object.entries(parsed.counts)) {
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0) clean.counts[k] = Math.floor(v);
      }
    }
    return clean;
  } catch {
    return null;
  }
}
