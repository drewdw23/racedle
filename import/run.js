/* Orchestrator. Usage:
     node run.js                     # all series
     node run.js --series=f1,wrc     # subset
     node run.js --debug             # per-season logging
     node run.js --series=f1 --validate   # also run the series' validator
                                          # source and diff the two in report.md

   Outputs (never touches ../data.js directly):
     output/drivers.generated.json   # full records + provenance
     output/data.generated.js        # paste-ready DRIVERS entries (incomplete rows commented)
     output/report.md                # coverage, gaps, and validation vs current data.js
*/

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SERIES_CONFIG, YEAR_FROM, YEAR_TO } from "./config.js";
import { collectF1 } from "./sources/f1.js";
import { collectF1DB } from "./sources/f1db.js";
import { collectNascar } from "./sources/nascar.js";
import { collectIndyCar } from "./sources/indycar.js";
import { collectSeasonRosters } from "./sources/wikipediaSeasons.js";
import { enrichRoster } from "./enrich.js";
import { emitDataJs } from "./lib/normalize.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "output");
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const debug = args.includes("--debug");
const validate = args.includes("--validate");
const seriesArg = args.find((a) => a.startsWith("--series="));
const selected = seriesArg ? seriesArg.split("=")[1].split(",") : Object.keys(SERIES_CONFIG);
const currentYear = new Date().getUTCFullYear();
const log = (m) => process.stdout.write(m + "\n");
const validationNotes = [];

async function collect(engine) {
  if (engine === "f1db") return collectF1DB(currentYear, log);
  if (engine === "jolpica") return collectF1(currentYear, log);
  if (engine === "nascar") return collectNascar(currentYear, log);
  if (engine === "indycar") return collectIndyCar(currentYear, log);
  return null;
}

/* Cross-source validation: diff primary vs validator per driver on the
   stat fields. Disagreements are for human review, not auto-resolution —
   two independent sources catching each other is the reliability story. */
function diffSources(seriesLabel, primary, secondary, primaryName, secondaryName) {
  const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();
  const sec = new Map(secondary.map((r) => [strip(r.name), r]));
  const lines = [];
  let matched = 0;
  for (const p of primary) {
    const s = sec.get(strip(p.name));
    if (!s) continue;
    matched++;
    const diffs = [];
    for (const f of ["titles", "wins", "team", "debut"]) {
      if (p[f] != null && s[f] != null && String(p[f]) !== String(s[f])) diffs.push(`${f}: ${primaryName}=${p[f]} ${secondaryName}=${s[f]}`);
    }
    if (diffs.length) lines.push(`- ${p.name}: ${diffs.join("; ")}`);
  }
  validationNotes.push(
    `### ${seriesLabel}: ${primaryName} vs ${secondaryName}\n` +
    `${matched} drivers matched across sources; ${lines.length} with disagreements.\n` +
    (lines.length ? lines.join("\n") : "- (no disagreements)")
  );
  log(`${seriesLabel} validation: ${matched} matched, ${lines.length} disagreements (details in report.md)`);
}

async function main() {
  log(`Racedle import — ${YEAR_FROM}-${YEAR_TO} — series: ${selected.join(", ")}\n`);
  let all = [];

  for (const id of selected) {
    const cfg = SERIES_CONFIG[id];
    if (!cfg) {
      log(`! unknown series "${id}" — skipping`);
      continue;
    }
    const collected = await collect(cfg.engine);
    if (collected) {
      all.push(...collected);
      if (validate && cfg.validator) {
        const check = await collect(cfg.validator);
        if (check) diffSources(cfg.series, collected, check, cfg.engine, cfg.validator);
      }
    } else {
      const roster = await collectSeasonRosters(id, cfg, log, debug);
      all.push(...(await enrichRoster(id, cfg.series, roster, currentYear, log)));
    }
  }

  // Dedupe by name: keep the record with the most complete data.
  const byName = new Map();
  for (const r of all) {
    const prev = byName.get(r.name);
    if (!prev || score(r) > score(prev)) byName.set(r.name, r);
  }
  const records = [...byName.values()].sort((a, b) =>
    a.series === b.series ? a.name.localeCompare(b.name) : a.series.localeCompare(b.series)
  );

  writeFileSync(join(OUT, "drivers.generated.json"), JSON.stringify(records, null, 2));
  writeFileSync(join(OUT, "data.generated.js"), emitDataJs(records));
  writeFileSync(join(OUT, "report.md"), report(records));
  log(`\nWrote ${records.length} records to output/. Review report.md before merging.`);
}

function score(r) {
  return ["country", "team", "titles", "wins", "status", "debut"].reduce(
    (n, k) => n + (r[k] != null ? 1 : 0),
    0
  );
}

function loadCurrentDrivers() {
  const p = join(__dir, "..", "data.js");
  if (!existsSync(p)) return [];
  try {
    const src = readFileSync(p, "utf8");
    // data.js declares SERIES/GENRES/FLAGS/DRIVERS as consts in one scope;
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
  const bySeries = {};
  for (const r of records) bySeries[r.series] = (bySeries[r.series] || 0) + 1;

  const missingFromGen = current.filter((d) => !genNames.has(d.name)).map((d) => d.name);
  const newVsCurrent = records.filter((r) => !curNames.has(r.name)).map((r) => r.name);

  const L = [];
  L.push(`# Racedle import report`);
  L.push(`Range ${YEAR_FROM}-${YEAR_TO}. Generated ${records.length} records — ${complete} complete, ${incomplete} need curation.\n`);
  L.push(`## Coverage by series`);
  for (const [s, n] of Object.entries(bySeries).sort()) L.push(`- ${s}: ${n}`);
  L.push(`\n## Needs curation (missing team / titles / wins)`);
  L.push(`${incomplete} rows are commented out in data.generated.js with a TODO(review). For the non-F1 series, titles and wins are not reliably a single number in Wikidata and must be filled from each driver's Wikipedia infobox or an official record.\n`);
  L.push(`## Validation vs current data.js (${current.length} hand-curated drivers)`);
  L.push(`Current drivers NOT re-found by the pipeline (${missingFromGen.length}) — check for name spelling mismatches or drivers who never ran a *full* season in range:`);
  L.push(missingFromGen.length ? missingFromGen.map((n) => `- ${n}`).join("\n") : "- (none)");
  L.push(`\nNew drivers found vs current (${newVsCurrent.length}) — candidates to add after curation:`);
  L.push(newVsCurrent.slice(0, 500).map((n) => `- ${n}`).join("\n"));
  if (newVsCurrent.length > 500) L.push(`- …and ${newVsCurrent.length - 500} more`);
  if (validationNotes.length) {
    L.push(`\n## Cross-source validation`);
    L.push(validationNotes.join("\n\n"));
  }
  return L.join("\n") + "\n";
}

main().catch((e) => {
  process.stderr.write(String(e.stack || e) + "\n");
  process.exit(1);
});
