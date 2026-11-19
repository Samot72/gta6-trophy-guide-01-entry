# gta6-trophy-guide-01-entry

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — an offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5. All 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden) with their official names, descriptions and grades, a guide in our own words for every single one, the source of each guide named beside it, a three-step roadmap to the platinum, and the one suspected missable flagged in red before it can bite.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

Any static file server pointed at `app/` works just as well. The guide itself needs no server features and no network: open it, and everything — data, guides, your progress — stays on your machine.

## What it does

- **Checklist for all 55 trophies** with the official name, description and grade of each, a checkbox per trophy, and a running progress header (overall and per grade).
- **A real guide per trophy**, written for this entry: what to do, where, in what order, and what can go wrong — including the counts PlayStation tracks (250 stunts, 42 shooting-range challenges, 18 meditation spots, 500 criminal-profile actions…), shown as a personal counter you can fill in as you play.
- **Cited sources, per trophy.** Every guide names where its facts come from (chiefly PowerPyx's launch trophy guide and roadmap, the Exophase/PSNProfiles list as mirrored by PlanetGTA6, and GTABase's 100% checklist reporting). A cited guide beats an uncited one; where launch-week guides have not confirmed a trigger — Bad Luck, I Guess and Ten Pin — the guide says so plainly instead of inventing steps.
- **Roadmap & missables view**: three steps (story ≈60–80 h → the 100% checklist ≈100 h → cleanup ≈10 h) with the trophies grouped under each, plus a missables panel. Exactly one trophy is flagged potentially missable: **Positive Mental Attitude**, over a meditation that exists only in Chapter 1 at Jason's house.
- **Filters and search**: by kind (story, strangers & side missions, collectibles & exploration, activities, crime & combat, money & property, secrets), by grade, and by status (earned / missing / missable only).
- **Spoiler shield**: hide the names, descriptions and guides of story trophies until you have earned them.
- **Progress that persists and travels**: earned trophies and counters are kept in `localStorage`; export downloads a small JSON file, and import accepts that file, a bare list of trophy ids, or a bare list of trophy names.

## The hand-in program

`main.ts` (Node 22, standard library only) is the entry program for the bounty: it sanity-checks `app/data/trophies.json` (exactly 55 trophies, every one with a guide), copies `app/` and `screenshots/` to the output directory, and writes `dossier.json` with the vendored `vendor/makefun-frontend.ts` library, byte for byte as the scorer rebuilds it.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/index.html` — the page: progress header, filter bar, checklist + guide panel, roadmap view.
- `app/tracker.js` — state: loads the data, keeps earned trophies and counters in localStorage, exports/imports progress JSON.
- `app/views.js` — rendering: checklist rows, the guide panel with its sources, the roadmap and missables.
- `app/app.js` — wiring: filters, search, view switching, the spoiler shield.
- `app/data/trophies.json` — the 55 trophies: official name/description/grade, hidden flag, kind, roadmap stage, tracked count where PlayStation has one, the guide, and its sources.
- `screenshots/` — four unedited renders of the app (checklist with a guide open, the roadmap, a long guide, the spoiler shield at work); `shots.json` says what each one shows.

Not affiliated with Rockstar Games. No game artwork, logos or screenshots are used; the look is this entry's own.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8ka4j3rq&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
