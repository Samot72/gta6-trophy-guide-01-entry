/* tracker.js — Leonida Legend's state keeper.
 * Loads the trophy data, remembers which trophies are earned (and the
 * running counts toward the tracked ones) in localStorage, and converts
 * progress to and from a portable JSON file. No network, no dependencies.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'leonida-legend-progress-v1';

  var trophies = [];
  var byId = {};
  var byName = {};
  var listeners = [];

  // state.earned: { "17": true } · state.counts: { "17": 31 }
  var state = loadState();

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { earned: {}, counts: {} };
      var parsed = JSON.parse(raw);
      return {
        earned: parsed && parsed.earned ? parsed.earned : {},
        counts: parsed && parsed.counts ? parsed.counts : {},
      };
    } catch (err) {
      return { earned: {}, counts: {} };
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* storage full or blocked: the tracker still works for this session */
    }
    listeners.forEach(function (fn) { fn(); });
  }

  function index(list) {
    trophies = list.slice();
    byId = {};
    byName = {};
    trophies.forEach(function (t) {
      byId[t.id] = t;
      byName[t.name.toLowerCase()] = t;
    });
  }

  function load(url) {
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('trophy data failed to load: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        index(Array.isArray(data) ? data : data.trophies || []);
        return trophies;
      });
  }

  function isEarned(id) {
    return state.earned[id] === true;
  }

  function setEarned(id, earned) {
    if (earned) state.earned[id] = true;
    else delete state.earned[id];
    saveState();
  }

  function toggle(id) {
    setEarned(id, !isEarned(id));
    return isEarned(id);
  }

  function getCount(id) {
    return state.counts[id] || 0;
  }

  function setCount(id, n) {
    var clean = Math.max(0, Math.floor(Number(n) || 0));
    var trophy = byId[id];
    if (trophy && trophy.target) clean = Math.min(clean, trophy.target);
    if (clean > 0) state.counts[id] = clean;
    else delete state.counts[id];
    if (trophy && trophy.target && clean >= trophy.target) state.earned[id] = true;
    saveState();
  }

  function totals() {
    var out = { earned: 0, total: trophies.length, byGrade: {}, byKind: {} };
    trophies.forEach(function (t) {
      out.byGrade[t.grade] = out.byGrade[t.grade] || { earned: 0, total: 0 };
      out.byGrade[t.grade].total += 1;
      out.byKind[t.kind] = out.byKind[t.kind] || { earned: 0, total: 0 };
      out.byKind[t.kind].total += 1;
      if (isEarned(t.id)) {
        out.earned += 1;
        out.byGrade[t.grade].earned += 1;
        out.byKind[t.kind].earned += 1;
      }
    });
    return out;
  }

  /* Export: a small, documented JSON document.
   * { "format": "leonida-legend-progress", "version": 1,
   *   "earned": [ids…], "counts": { "id": n } }                       */
  function exportData() {
    var earnedIds = Object.keys(state.earned).map(Number).sort(function (a, b) { return a - b; });
    return {
      format: 'leonida-legend-progress',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: earnedIds,
      earnedNames: earnedIds.map(function (id) { return byId[id] ? byId[id].name : String(id); }),
      counts: state.counts,
    };
  }

  /* Import is forgiving on purpose: it accepts this app's export, a bare
   * array of trophy ids, a bare array of trophy names, or an object whose
   * "earned" is either of those. Returns how many trophies were marked. */
  function importData(payload) {
    var list = null;
    var counts = null;
    if (Array.isArray(payload)) {
      list = payload;
    } else if (payload && Array.isArray(payload.earned)) {
      list = payload.earned;
      counts = payload.counts || null;
    } else if (payload && Array.isArray(payload.earnedNames)) {
      list = payload.earnedNames;
    }
    if (!list) throw new Error('No "earned" list found in that file.');

    var next = { earned: {}, counts: {} };
    var marked = 0;
    list.forEach(function (entry) {
      var trophy = null;
      if (typeof entry === 'number' || /^\d+$/.test(String(entry))) trophy = byId[Number(entry)];
      if (!trophy && typeof entry === 'string') trophy = byName[entry.toLowerCase()];
      if (trophy) {
        next.earned[trophy.id] = true;
        marked += 1;
      }
    });
    if (counts) {
      Object.keys(counts).forEach(function (id) {
        if (byId[id]) next.counts[id] = Math.max(0, Math.floor(Number(counts[id]) || 0));
      });
    }
    state = next;
    saveState();
    return marked;
  }

  window.Tracker = {
    load: load,
    all: function () { return trophies; },
    get: function (id) { return byId[id]; },
    isEarned: isEarned,
    setEarned: setEarned,
    toggle: toggle,
    getCount: getCount,
    setCount: setCount,
    totals: totals,
    exportData: exportData,
    importData: importData,
    onChange: function (fn) { listeners.push(fn); },
  };
})();
