/* app.js — Leonida Legend's wiring.
 * Owns the filter state, connects the controls to Tracker and Views, and
 * handles progress export (download a JSON file) and import (read one).
 */
(function () {
  'use strict';

  var filters = {
    query: '',
    kind: 'all',
    grade: 'all',
    status: 'all',
    spoilerOn: false,
    view: 'checklist',
    selectedId: null,
  };

  function matches(trophy) {
    if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !window.Tracker.isEarned(trophy.id)) return false;
    if (filters.status === 'missing' && window.Tracker.isEarned(trophy.id)) return false;
    if (filters.status === 'missable' && !trophy.missable) return false;
    if (filters.query) {
      var hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.kind + ' ' + trophy.guide).toLowerCase();
      if (hay.indexOf(filters.query.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function refresh() {
    window.Views.renderProgress();
    var list = window.Tracker.all().filter(matches);
    window.Views.renderList(list, filters.selectedId, filters.spoilerOn, selectTrophy, toggleTrophy);
    var selected = filters.selectedId ? window.Tracker.get(filters.selectedId) : null;
    window.Views.renderDetail(selected, filters.spoilerOn, toggleTrophy, setCount);
    if (filters.view === 'roadmap') window.Views.renderRoadmap();
  }

  function selectTrophy(id) {
    filters.selectedId = id;
    refresh();
  }

  function toggleTrophy(id) {
    window.Tracker.toggle(id);
    refresh();
  }

  function setCount(id, value) {
    window.Tracker.setCount(id, value);
    refresh();
  }

  function buildKindChips() {
    var host = document.getElementById('kind-filters');
    var kinds = ['all'].concat(Object.keys(window.Views.KIND_LABELS));
    kinds.forEach(function (kind) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'kind-chip' + (filters.kind === kind ? ' is-active' : '');
      chip.textContent = kind === 'all' ? 'All kinds' : window.Views.KIND_LABELS[kind];
      chip.addEventListener('click', function () {
        filters.kind = kind;
        host.querySelectorAll('.kind-chip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        refresh();
      });
      host.appendChild(chip);
    });
  }

  function downloadProgress() {
    var payload = JSON.stringify(window.Tracker.exportData(), null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'leonida-legend-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      try {
        var marked = window.Tracker.importData(JSON.parse(String(reader.result)));
        window.alert('Imported progress: ' + marked + ' trophies marked as earned.');
        refresh();
      } catch (err) {
        window.alert('That file could not be imported: ' + err.message);
      }
    });
    reader.readAsText(file);
  }

  function setView(view) {
    filters.view = view;
    document.getElementById('checklist-view').hidden = view !== 'checklist';
    document.getElementById('roadmap-view').hidden = view !== 'roadmap';
    document.getElementById('view-checklist').classList.toggle('is-active', view === 'checklist');
    document.getElementById('view-roadmap').classList.toggle('is-active', view === 'roadmap');
    refresh();
  }

  function wire() {
    document.getElementById('search-box').addEventListener('input', function (ev) {
      filters.query = ev.target.value;
      refresh();
    });
    document.getElementById('grade-filter').addEventListener('change', function (ev) {
      filters.grade = ev.target.value;
      refresh();
    });
    document.getElementById('status-filter').addEventListener('change', function (ev) {
      filters.status = ev.target.value;
      refresh();
    });
    document.getElementById('spoiler-checkbox').addEventListener('change', function (ev) {
      filters.spoilerOn = ev.target.checked;
      refresh();
    });
    document.getElementById('export-btn').addEventListener('click', downloadProgress);
    document.getElementById('import-file').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    document.getElementById('view-checklist').addEventListener('click', function () { setView('checklist'); });
    document.getElementById('view-roadmap').addEventListener('click', function () { setView('roadmap'); });
    window.Tracker.onChange(refresh);
  }

  window.Tracker.load('data/trophies.json').then(function () {
    buildKindChips();
    wire();
    // Open on a trophy that shows the guide at its best: the missable one.
    filters.selectedId = 28;
    refresh();
  }).catch(function (err) {
    document.getElementById('trophy-list').innerHTML =
      '<li class="detail-hint">The trophy data could not be loaded (' + err.message + '). Serve this folder over HTTP — for example with the repository’s serve.ts — rather than opening the file directly.</li>';
  });
})();
