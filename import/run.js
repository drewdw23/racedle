/* Orchestrator. Usage:
     node run.js            # build the NASCAR Cup pool

   Outputs (never touches ../data.js directly — merge-nascar.js does that):
     output/drivers.generated.json   # full records + provenance
     output/data.generated.js        # paste-ready DRIVERS entries (incomplete rows commented)
     output/report.md                # coverage, gaps, and diff vs current data.js
*/

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { YEAR_FROM, YEAR_TO } from "./config.js";
import { collectNascar } from "./sources/nascar.js";
import { emitDataJs } from "./lib/normalize.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "output");
mkdirSync(OUT, { recursive: true });

const currentYear = new Date().getUTCFullYear();
const log = (m) => process.stdout.write(m + "\n");

async function main() {
  log(`Racedle import — NASCAR Cup ${YEAR_FROM}-${YEAR_TO}\n`);
  const records = (await collectNascar(currentYear, log)).sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(join(OUT, "drivers.generated.json"), JSON.stringify(records, null, 2));
  writeFileSync(join(OUT, "data.generated.js"), emitDataJs(records));
  writeFileSync(join(OUT, "report.md"), report(records));
  log(`\nWrote ${records.length} records to output/. Next: node merge-nascar.js`);
}

function loadCurrentDrivers() {
  const p = join(__dir, "..", "data.js");
  if (!existsSync(p)) return [];
  try {
    const src = readFileSync(p, "utf8");
    // data.js declares SERIES/GENRES/DRIVERS as consts in one scope;
    // evaluate in a function and hand back DRIVERS.
    // eslint-disable-next-line no-new-func
    return Function(`${src}\n;return DRIVERS;`)();
  } catch (e) {
    return [];
  }
}

function report(records) {
  const current = loadCurrentDrivers();
  const curNames = new Set(current.map((d) => d.name));
  const genNames = new Set(records.map((r) => r.name));

  const complete = records.filter((r) => r._complete).length;
  const incomplete = records.length - complete;
  const missingFromGen = current.filter((d) => !genNames.has(d.name)).map((d) => d.name);
  const newVsCurrent = records.filter((r) => !curNames.has(r.name)).map((r) => r.name);

  const L = [];
  L.push(`# Racedle import report — NASCAR Cup`);
  L.push(`Range ${YEAR_FROM}-${YEAR_TO}. Generated ${records.length} records — ${complete} complete, ${incomplete} missing a team (merge-nascar.js fills known ones from TEAM_FALLBACK).\n`);
  L.push(`## Current drivers NOT re-found by the pipeline (${missingFromGen.length})`);
  L.push(missingFromGen.length ? missingFromGen.map((n) => `- ${n}`).join("\n") : "- (none)");
  L.push(`\n## New drivers vs current data.js (${newVsCurrent.length})`);
  L.push(newVsCurrent.length ? newVsCurrent.map((n) => `- ${n}`).join("\n") : "- (none)");
  return L.join("\n") + "\n";
}

main().catch((e) => {
  process.stderr.write(String(e.stack || e) + "\n");
  process.exit(1);
});
