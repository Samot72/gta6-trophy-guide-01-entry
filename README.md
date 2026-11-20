# Route 55 — The Platinum Line

A GTA VI platinum roadmap drawn as a transit line through Leonida. All 55
trophies are stops on one line, laid out in the order you should earn them:
the story first, strands and robberies as they unlock, the 100% checklist as
the long final stretch, and the platinum waiting at the terminus.

This is round 2 of this entry — a new concept, not a reskin. Round 1 was a
plain two-pane checklist; the line replaces the list as the interface itself.

## Riding the line

- **The map is the roadmap.** Seven stages, one per leg of the journey. Click
  a stop to open its guide; click a stage tag (or a stage chip) to zoom into
  that stage. Earned stops fill with their stage colour.
- **Every step is cited.** Each trophy's guide is broken into steps, and every
  step names the source it came from — 163 cited steps across the 55 stops.
- **The guide audits itself.** The strip under the header is computed live
  from the app's own data: official names verified, cited steps counted,
  tracked counters counted, the missable audited, the unconfirmed flagged.
  Nothing in it is hard-coded.
- **One missable, flagged everywhere.** Positive Mental Attitude carries the
  run's only missable moment — a Chapter 1 balcony meditation that cannot be
  replayed. It wears a warning dot on the line, a banner in its guide, and a
  flag on the departure board.
- **Two unconfirmed, honestly empty.** Bad Luck, I Guess and Ten Pin have no
  verified trigger in any launch-week source, so their stops say what is
  known and invent nothing.
- **Tracker built in.** Check off stops, nudge the per-trophy counters
  PlayStation itself tracks (250 stunts, 42 gold medals, $250,000 laundered…)
  and watch the journey bar and per-grade counts move. Progress persists in
  localStorage and exports/imports as JSON.
- **Spoiler fog.** Hidden story trophies show as "Hidden Trophy" on the line,
  in the panel and on the board until you earn them — or until you switch
  the fog off.
- **Departure board.** The whole line as a filterable station board: stage,
  kind, grade, earned/missing, missable-only.

Names and descriptions are the official PlayStation trophy list (1 platinum,
2 gold, 6 silver, 46 bronze; 28 hidden). Guides are written for this entry;
sources are cited per step, never copied.

## Run it

```
node serve.ts          # serves app/ at http://localhost:8080
```

## Build / hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the data (55 trophies, grade split, every step cited,
missable/unconfirmed/hidden counts, screenshot sizes read from the image
headers) and then writes `app/`, `screenshots/` and `dossier.json` to the
output directory using the vendored make.fun library.

## Layout

- `app/index.html` — the page shell
- `app/css/line.css` — the dark transit-map styling
- `app/js/route-map.js` — the SVG line: full map and stage zoom
- `app/js/stops.js` — a stop's guide panel, counters, spoiler fog
- `app/js/departure-board.js` — the filterable station board
- `app/js/audit.js` — the live self-audit strip
- `app/js/tracker.js` — progress state, localStorage, export/import
- `app/js/app.js` — boot, filters, wiring
- `app/data/trophies.json` — the 55 trophies: stages, stops, steps, citations

[![make.fun entry](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Samot72/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
