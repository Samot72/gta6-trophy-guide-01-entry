/* views.js — Leonida Legend's rendering.
 * Builds the progress header, the checklist rows, the guide panel and the
 * roadmap from Tracker's data. Trophy text is inserted with textContent,
 * never as markup, so the data file can never break the page.
 */
(function () {
  'use strict';

  var GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
  var KIND_LABELS = {
    completion: 'Completion',
    story: 'Story',
    strangers: 'Strangers & side missions',
    collectibles: 'Collectibles & exploration',
    activities: 'Activities',
    crime: 'Crime & combat',
    money: 'Money & property',
    secrets: 'Secrets & easter eggs',
  };

  var ROADMAP_STEPS = [
    {
      n: 1,
      title: 'Step 1 — Finish the story, start everything as it unlocks',
      hours: 'about 60–80 hours',
      text: 'Play the five chapters and enjoy them; the checklist is not even visible yet, but everything you do already counts toward it. There are no mission gold medals to chase. Three habits pay off later: scan every new vehicle with the WAiNK app, study animals through the binoculars, and start each stranger questline when it appears. Above all, do the Chapter 1 balcony meditation at Jason’s house when Lucia offers it (see Positive Mental Attitude) — it is the run’s only suspected missable. Keep a manual save at each chapter break.',
    },
    {
      n: 2,
      title: 'Step 2 — Clear the 100% completion checklist',
      hours: 'about 100 hours',
      text: 'After the credits the checklist opens under Progress > Stats > 100% Completion. It asks for roughly 60% of the game, not all of it: 100 optional missions (there are far more), 200 of 277 vehicle scans, 100 of 255 animals studied, any 70 of 80 challenges — but robberies, shooting ranges, drone races and Bret’s hunting decks in full. Most trophies on this list fall out of the checklist work itself; A Long Road pops when the checklist completes.',
    },
    {
      n: 3,
      title: 'Step 3 — Strangers, partner tricks and secrets cleanup',
      hours: 'about 10 hours',
      text: 'Whatever remains is quick: the stranger strands that do not count toward 100%, the two partner trophies (Hot Together, Retail Therapy), one-off feats like Gunslinger and the tank and jet thefts, and the hidden easter-egg trophies. The two unconfirmed trophies (Bad Luck, I Guess and Ten Pin) may still be unsolved when you get here — check their guides’ sources for the latest word. When the last of the 54 pops, Vice Got a Price! follows immediately.',
    },
  ];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function gradeChip(grade) {
    return el('span', 'grade-chip grade-' + grade, grade);
  }

  function flagChip(kind, label) {
    return el('span', 'flag flag-' + kind, label);
  }

  function isSpoilered(trophy, spoilerOn) {
    return spoilerOn && trophy.kind === 'story' && !window.Tracker.isEarned(trophy.id);
  }

  /* ---------- progress header ---------- */

  function renderProgress() {
    var totals = window.Tracker.totals();
    document.getElementById('progress-summary').textContent =
      totals.earned + ' of ' + totals.total + ' trophies earned';
    document.getElementById('progress-fill').style.width =
      (totals.total ? (totals.earned / totals.total) * 100 : 0) + '%';
    var counts = document.getElementById('grade-counts');
    counts.textContent = '';
    GRADE_ORDER.forEach(function (grade, i) {
      var g = totals.byGrade[grade] || { earned: 0, total: 0 };
      if (i > 0) counts.appendChild(document.createTextNode(' · '));
      var label = el('span', null, grade + ' ');
      var bold = el('b', null, g.earned + '/' + g.total);
      label.appendChild(bold);
      counts.appendChild(label);
    });
  }

  /* ---------- checklist rows ---------- */

  function renderList(list, selectedId, spoilerOn, onSelect, onToggle) {
    var host = document.getElementById('trophy-list');
    host.textContent = '';
    if (!list.length) {
      host.appendChild(el('li', 'detail-hint', 'No trophies match those filters.'));
      return;
    }
    list.forEach(function (trophy) {
      var earned = window.Tracker.isEarned(trophy.id);
      var spoilered = isSpoilered(trophy, spoilerOn);
      var row = el('li', 'trophy-row' + (earned ? ' is-earned' : '') +
        (trophy.id === selectedId ? ' is-selected' : '') + (spoilered ? ' is-spoilered' : ''));

      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = earned;
      box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
      box.addEventListener('click', function (ev) { ev.stopPropagation(); });
      box.addEventListener('change', function () { onToggle(trophy.id); });
      row.appendChild(box);

      var main = el('div', 'trophy-main');
      main.appendChild(el('div', 'trophy-name', spoilered ? 'Hidden story trophy' : trophy.name));
      main.appendChild(el('div', 'trophy-desc', spoilered ? 'Earn it to reveal its description.' : trophy.description));
      row.appendChild(main);

      var flags = el('div', 'trophy-flags');
      if (trophy.missable) flags.appendChild(flagChip('missable', 'Missable'));
      if (trophy.unconfirmed) flags.appendChild(flagChip('unconfirmed', 'Unconfirmed'));
      if (trophy.hidden) flags.appendChild(flagChip('hidden', 'Hidden'));
      flags.appendChild(gradeChip(trophy.grade));
      row.appendChild(flags);

      row.addEventListener('click', function () { onSelect(trophy.id); });
      host.appendChild(row);
    });
  }

  /* ---------- detail / guide panel ---------- */

  function renderDetail(trophy, spoilerOn, onToggle, onCount) {
    var panel = document.getElementById('detail-panel');
    panel.textContent = '';
    if (!trophy) {
      panel.appendChild(el('p', 'detail-hint', 'Pick a trophy from the list to read its guide, sources and roadmap stage.'));
      return;
    }
    var earned = window.Tracker.isEarned(trophy.id);
    var spoilered = isSpoilered(trophy, spoilerOn);

    if (trophy.missable) {
      panel.appendChild(el('p', 'missable-warning',
        '⚠ Potentially missable: one step of this trophy exists only in Chapter 1 — read the guide before you finish the chapter.'));
    }
    if (trophy.unconfirmed) {
      panel.appendChild(el('p', 'unconfirmed-note',
        'Trigger unconfirmed at launch: no verified method exists yet, and this guide invents none.'));
    }

    panel.appendChild(el('h2', null, spoilered ? 'Hidden story trophy' : trophy.name));
    panel.appendChild(el('p', 'detail-desc', spoilered ? 'Its description is hidden until you earn it.' : '“' + trophy.description + '”'));

    var meta = el('div', 'detail-meta');
    meta.appendChild(gradeChip(trophy.grade));
    meta.appendChild(flagChip('hidden', KIND_LABELS[trophy.kind] || trophy.kind));
    meta.appendChild(flagChip('hidden', 'Roadmap step ' + trophy.stage));
    if (trophy.hidden) meta.appendChild(flagChip('hidden', 'Hidden on PSN'));
    if (trophy.target) {
      meta.appendChild(flagChip('hidden', 'PSN tracks: ' + trophy.target + ' ' + (trophy.unit || '')));
    }
    panel.appendChild(meta);

    if (spoilered) {
      panel.appendChild(el('p', 'detail-guide spoiler-text', trophy.guide));
      panel.appendChild(el('p', 'detail-hint', 'Spoiler shield is on: this guide is blurred until the trophy is earned.'));
    } else {
      panel.appendChild(el('p', 'detail-guide', trophy.guide));
    }

    if (trophy.sources && trophy.sources.length) {
      var box = el('div', 'detail-sources');
      box.appendChild(el('h3', null, 'Sources for this guide'));
      var ul = el('ul');
      trophy.sources.forEach(function (url) {
        var li = el('li');
        var a = el('a', null, url);
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        li.appendChild(a);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      panel.appendChild(box);
    }

    var earnRow = el('div', 'detail-earn');
    var btn = el('button', 'action-btn' + (earned ? ' is-active' : ''), earned ? '✓ Earned — tap to undo' : 'Mark as earned');
    btn.type = 'button';
    btn.addEventListener('click', function () { onToggle(trophy.id); });
    earnRow.appendChild(btn);
    if (trophy.target) {
      var label = el('label', null, 'My count: ');
      var input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(trophy.target);
      input.value = String(window.Tracker.getCount(trophy.id) || '');
      input.style.width = '76px';
      input.addEventListener('change', function () { onCount(trophy.id, input.value); });
      label.appendChild(input);
      label.appendChild(document.createTextNode(' / ' + trophy.target));
      earnRow.appendChild(label);
    }
    panel.appendChild(earnRow);
  }

  /* ---------- roadmap & missables ---------- */

  function renderRoadmap() {
    var host = document.getElementById('roadmap-steps');
    host.textContent = '';
    var all = window.Tracker.all();
    ROADMAP_STEPS.forEach(function (step) {
      var card = el('section', 'roadmap-step');
      card.appendChild(el('h3', null, step.title));
      card.appendChild(el('div', 'step-hours', step.hours));
      card.appendChild(el('p', null, step.text));
      var ul = el('ul');
      all.filter(function (t) { return t.stage === step.n; }).forEach(function (t) {
        var li = el('li', null, (window.Tracker.isEarned(t.id) ? '✓ ' : '') + t.name + ' ');
        li.appendChild(el('span', 'mini-grade', t.grade));
        ul.appendChild(li);
      });
      card.appendChild(ul);
      host.appendChild(card);
    });

    var miss = document.getElementById('missable-list');
    miss.textContent = '';
    all.filter(function (t) { return t.missable || t.unconfirmed; }).forEach(function (t) {
      var p = el('p', null, '');
      var strong = el('strong', null, t.name + ' — ');
      p.appendChild(strong);
      p.appendChild(document.createTextNode(t.missable
        ? 'the run’s one suspected missable. A meditation at Jason’s house exists only in Chapter 1 (after Down to Earth, follow Lucia to the balcony). Whether the trophy strictly needs it is unconfirmed, but it costs two minutes to be safe.'
        : 'trigger not yet confirmed by any launch guide. This entry gives no invented steps for it; open the trophy in the checklist for the current best knowledge and its sources.'));
      miss.appendChild(p);
    });
  }

  window.Views = {
    GRADE_ORDER: GRADE_ORDER,
    KIND_LABELS: KIND_LABELS,
    renderProgress: renderProgress,
    renderList: renderList,
    renderDetail: renderDetail,
    renderRoadmap: renderRoadmap,
  };
})();
