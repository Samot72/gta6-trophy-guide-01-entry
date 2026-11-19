// Entry program for the gta6-trophy-guide-01 bounty (Node 22, standard library only).
//
// The guide itself is the static web app in app/ — plain files a desktop browser opens
// at app/index.html and runs with the network off. This program is the delivery step:
// it copies app/ and screenshots/ from beside this file into the output directory and
// writes dossier.json there with the vendored make.fun library, which is the summary
// the scorer checks and the judge reads. vendor/makefun-frontend.ts stays untouched:
// the scorer requires the dossier to be byte for byte what its own copy writes.
//
// Run it the way the grader does, or locally with an output directory of your own:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoDir = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The guide's data file must name every trophy before anything is handed in; a short
// list would fail the scorer's trophies row anyway, so refuse early with a clear word.
const data = JSON.parse(readFileSync(join(repoDir, "app", "data", "trophies.json"), "utf8"));
if (!Array.isArray(data.trophies) || data.trophies.length !== 55) {
  throw new Error(`app/data/trophies.json must hold the 55 official trophies, found ${data.trophies?.length}`);
}
for (const trophy of data.trophies) {
  if (typeof trophy.name !== "string" || trophy.name.trim() === "") {
    throw new Error(`trophy #${trophy.id ?? "?"} has no name`);
  }
  if (typeof trophy.guide !== "string" || trophy.guide.trim() === "") {
    throw new Error(`trophy "${trophy.name}" has no guide`);
  }
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, "app"), join(outDir, "app"), { recursive: true });
if (existsSync(join(repoDir, "screenshots"))) {
  cpSync(join(repoDir, "screenshots"), join(outDir, "screenshots"), { recursive: true });
}

// The caps are the scorer's own (its gate reference): the dossier text is cut at
// 160 KiB, screenshots are at most 4 files of 256 KiB, and app/ is at most 993
// files and directories and 48 MiB. buildDossier refuses anything past them.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`handed in: app/ + screenshots/ + dossier.json (${dossier.length} bytes) -> ${outDir}`);
