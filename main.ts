// Route 55 — The Platinum Line: build & hand-in program (Node 22, stdlib only).
//
// The guide itself is app/ — plain static files (ES modules, CSS, one JSON data
// file), no build step, nothing loaded over the network. This program proves
// the data before it hands anything in: it re-checks the trophy list against
// the official shape (55 trophies, the published grade split), verifies that
// every guide step carries a citation, audits the missable / unconfirmed /
// hidden counts, and enforces the screenshot rules by reading the image
// headers itself. Only then does it copy app/ + screenshots/ to the output
// directory and write dossier.json with the vendored make.fun library, left
// untouched, exactly as the scorer will.
//
// Local run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error(`route55 build: ${message}`);
}

// ---------- 1. Validate the trophy data ----------
const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = data.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) fail(`expected 55 trophies, found ${trophies?.length}`);

const EXPECTED_SPLIT = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const split = {};
let steps = 0;
let counters = 0;
let missable = 0;
let unconfirmed = 0;
let hidden = 0;
const stagesSeen = new Set();

trophies.forEach((t, i) => {
  if (t.id !== i + 1) fail(`trophy at index ${i} has id ${t.id}, expected ${i + 1}`);
  if (!t.name?.trim() || !t.description?.trim()) fail(`trophy ${t.id} has a blank name or description`);
  if (!t.guide?.trim()) fail(`trophy ${t.id} (${t.name}) has a blank guide`);
  split[t.grade] = (split[t.grade] ?? 0) + 1;
  if (!(t.stage >= 1 && t.stage <= 7)) fail(`trophy ${t.id} has stage ${t.stage}`);
  stagesSeen.add(t.stage);
  if (!Array.isArray(t.steps) || t.steps.length === 0) fail(`trophy ${t.id} (${t.name}) has no steps`);
  for (const s of t.steps) {
    steps += 1;
    if (!s.text?.trim()) fail(`trophy ${t.id} has a blank step`);
    if (!s.source || typeof data.sources?.[s.source] !== 'string') {
      fail(`trophy ${t.id} (${t.name}) has an uncited step: "${s.text?.slice(0, 40)}…"`);
    }
  }
  if (typeof t.count === 'number') counters += 1;
  if (t.missable) missable += 1;
  if (t.unconfirmed) unconfirmed += 1;
  if (t.hidden) hidden += 1;
});
for (const [grade, n] of Object.entries(EXPECTED_SPLIT)) {
  if (split[grade] !== n) fail(`grade split broken: ${grade} is ${split[grade]}, expected ${n}`);
}
if (stagesSeen.size !== 7) fail(`expected all 7 stages, saw ${stagesSeen.size}`);
if (missable !== 1) fail(`expected exactly 1 missable trophy, found ${missable}`);
if (unconfirmed !== 2) fail(`expected exactly 2 unconfirmed trophies, found ${unconfirmed}`);
if (hidden !== 28) fail(`expected 28 hidden trophies, found ${hidden}`);

// ---------- 2. Validate the app shell ----------
const indexBytes = statSync(join(here, 'app', 'index.html')).size;
if (indexBytes > 1024 * 1024) fail(`app/index.html is ${indexBytes} bytes, over the 1 MiB cap`);

// ---------- 3. Validate the screenshots by reading their headers ----------
function imageSize(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }; // PNG IHDR
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let p = 2; // JPEG: walk segments to a Start-Of-Frame marker
    while (p + 9 < buf.length) {
      if (buf[p] !== 0xff) { p += 1; continue; }
      const marker = buf[p + 1];
      if (marker >= 0xc0 && marker <= 0xc3) return { width: buf.readUInt16BE(p + 7), height: buf.readUInt16BE(p + 5) };
      p += 2 + buf.readUInt16BE(p + 2);
    }
  }
  return null;
}

const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir) ? readdirSync(shotDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort() : [];
if (shots.length < 3 || shots.length > 4) fail(`expected 3–4 screenshots, found ${shots.length}`);
for (const f of shots) {
  const buf = readFileSync(join(shotDir, f));
  if (buf.length > 262144) fail(`screenshot ${f} is ${buf.length} bytes, over the 256 KiB cap`);
  const size = imageSize(buf);
  if (!size) fail(`screenshot ${f}: could not read image dimensions`);
  const long = Math.max(size.width, size.height);
  const short = Math.min(size.width, size.height);
  if (long > 1280) fail(`screenshot ${f} is ${size.width}×${size.height}, long side over 1280`);
  if (short < 480) fail(`screenshot ${f} is ${size.width}×${size.height}, short side under 480`);
}

// ---------- 4. Hand in ----------
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);

console.log(
  `route55: 55 trophies · ${steps} cited steps · ${counters} counters · ${missable} missable · `
  + `${unconfirmed} unconfirmed · ${hidden} hidden · ${shots.length} screenshots · dossier ${Buffer.byteLength(dossier)} bytes`,
);
