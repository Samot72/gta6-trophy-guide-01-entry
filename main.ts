// Leonida Legend — entry program for make.fun's gta6-trophy-guide-01 bounty.
//
// What this program does, in order:
//   1. Sanity-checks the guide's data file: the official list has exactly 55
//      trophies and every one of them must carry a non-empty guide, because
//      the sealed gate refuses the entry otherwise. Failing here, loudly and
//      before anything is copied, beats failing on the server.
//   2. Copies app/ and screenshots/ from beside this file into the output
//      directory (/output in the grader; $MAKEFUN_OUTPUT_DIR elsewhere).
//   3. Writes dossier.json into the output with the vendored library's
//      buildDossier, under the gate's own caps, and reports its size.
//
// Node 22, standard library only. vendor/makefun-frontend.ts is the kit's
// library and stays byte-identical to it: the scorer rebuilds the dossier
// with its own copy and compares the two byte for byte.

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const EXPECTED_TROPHIES = 55;
const DOSSIER_CAP_BYTES = 1.5 * 1024 * 1024;

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- step 1: the data check -------------------------------------------------

const dataPath = join(repoDir, 'app', 'data', 'trophies.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const list = Array.isArray(data) ? data : data.trophies;
if (!Array.isArray(list) || list.length !== EXPECTED_TROPHIES) {
  throw new Error(`trophies.json must list ${EXPECTED_TROPHIES} trophies, found ${Array.isArray(list) ? list.length : 'none'}`);
}
const guideless = list.filter((t) => typeof t?.name !== 'string' || typeof t?.guide !== 'string' || t.guide.trim() === '');
if (guideless.length > 0) {
  throw new Error(`trophies.json has ${guideless.length} trophies with no name or an empty guide`);
}

// --- step 2: copy the guide and its screenshots -----------------------------

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// --- step 3: the dossier ------------------------------------------------------

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);

const bytes = statSync(dossierPath).size;
if (bytes > DOSSIER_CAP_BYTES) {
  throw new Error(`dossier.json is ${bytes} bytes, over the 1.5 MiB cap`);
}

// Note on determinism: the grader runs this program twice, each time in a
// fresh container with an empty /output, and requires both runs to write
// the same bytes. buildDossier derives everything from app/ and
// screenshots/ — no clocks, no randomness, no environment input — so two
// fresh runs agree; the hand-in was verified that way before submitting.

console.log(`handed in: ${list.length} trophies with guides, dossier.json ${bytes} bytes`);
