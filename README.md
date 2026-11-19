[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Guide — all 55 GTA VI trophies, tracked offline

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI,
built as an entry for the make.fun bounty
[gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01). Open `app/index.html`
from any static server (or run `node serve.ts` and visit http://localhost:8080) and it
works with the network off — it loads nothing from outside its own files.

## What it does

- **The full official list.** All 55 trophies with their exact PlayStation names, official
  descriptions and grades — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 of them hidden on
  PSN until earned, 17 tied to the story.
- **A tracker.** Tick trophies off as you earn them; progress (and the percentage and
  per-grade counts) is saved in the browser's localStorage, and can be exported to a JSON
  file and imported back on another machine.
- **Filters and search.** By state (earned / missing), by kind (story, collectibles,
  activities, crime, exploration, lifestyle, completion), by grade, by the missable flag,
  or by free text.
- **A spoiler setting.** Turn it on and unearned story trophies show as “Hidden story
  trophy” — names, descriptions and guides stay covered until you tick them earned.
- **A roadmap to the Platinum.** Three steps over roughly 200 hours at 4/10 difficulty
  (PowerPyx's estimate): the story with the right habits, the lenient 100% Completion
  checklist, then Strangers & Freaks and cleanup. One playthrough is enough.
- **The missable, flagged.** Exactly one trophy is reported as potentially missable —
  **Positive Mental Attitude**: its first meditation spot, at Jason's house in Chapter 1,
  disappears after that chapter (PowerPyx). It is flagged in the list, in its guide, and
  on the roadmap page.
- **A cited guide to every trophy.** Each guide is written for this page, in our own
  words — what to do, where and how, and when it can be missed — and names its sources
  beside it. Five trophies whose triggers the launch-week guides had not pinned down by
  19 November 2026 are marked *unconfirmed* in their guides rather than guessed.

## Data and sources

Names, descriptions and grades are the official PlayStation Network list, as carried in
the make.fun kit starter and cross-checked on 2026-11-19 against PlanetGTA6's list
(read from Exophase, checked against PSNProfiles and TrueAchievements). GTA VI launched
on 19 November 2026, so the list is complete; Rockstar has not posted a list of its own.

Methods, thresholds and the roadmap draw on these launch-week guides, cited per trophy
in `app/data/trophies.json` and in the app itself:

- [PlanetGTA6 — GTA 6 trophies (official list via Exophase)](https://www.planetgta6.com/en/gta-6-trophies/)
- [PowerPyx — GTA 6 trophy guide & roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/)
- [GTA Zone — GTA 6 trophy list: all 55 trophies and achievements](https://gta-zone.com/news/gta-6-trophies-achievements/)
- [Vice City Hub — GTA 6 achievements and the 100% checklist](https://www.gtavicecityhub.com/achievements)

## Layout

- `main.ts` — the entry program (Node 22): copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored library.
- `vendor/makefun-frontend.ts` — the make.fun frontend library, copied from the kit unchanged.
- `app/` — the guide itself: `index.html`, `app.js`, `style.css`, and the data in
  `app/data/trophies.json` (one item per trophy: name, description, grade, hidden flag,
  kind, missable flag, guide, source keys).
- `screenshots/` — four renders of the guide's own pages (see `shots.json` for what each shows).
- `serve.ts` — a tiny local server for trying the guide.

## License

MIT. An unofficial fan work: not affiliated with Rockstar Games or Take-Two Interactive,
and it uses no Rockstar logo or artwork — the look is this page's own.
