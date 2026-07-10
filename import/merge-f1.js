/* Merge the generated F1 set (output/drivers.generated.json, produced by
   `node run.js --series=f1`) into ../data.js, replacing the F1 section.

   Runs golden tests FIRST and refuses to write if any fail. Preserves:
   - pre-1970 hand-kept legends (outside the import's 1970+ scope)
   - dual-career drivers assigned to a non-F1 primary series (excluded
     from the F1 emit so they aren't duplicated or recategorized)

   Usage: node merge-f1.js          (then review `git diff ../data.js`)
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FULL_SEASON_FRACTION } from "./config.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");

const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

/* Pre-1970 champions kept by hand — the import scope starts at 1970. */
const LEGENDS = [
  "Jim Clark", "Juan Manuel Fangio", "Phil Hill", "Mike Hawthorn", "Alberto Ascari",
  "Giuseppe Farina", "Stirling Moss", "Wolfgang von Trips", "Tony Brooks", "Jose Froilan Gonzalez",
];

/* Golden set: every World Champion who raced in 1970 or later. If any
   of these is missing from the generated pool, the source or the
   full-season rule is broken — do not merge. */
const CHAMPIONS_1970_PLUS = [
  "Jack Brabham", "Graham Hill", "Denny Hulme", "Jochen Rindt", "Jackie Stewart",
  "Emerson Fittipaldi", "Niki Lauda", "James Hunt", "Mario Andretti", "Jody Scheckter",
  "Alan Jones", "Nelson Piquet", "Keke Rosberg", "Alain Prost", "Ayrton Senna",
  "Nigel Mansell", "Michael Schumacher", "Damon Hill", "Jacques Villeneuve", "Mika Hakkinen",
  "Fernando Alonso", "Kimi Raikkonen", "Lewis Hamilton", "Jenson Button", "Sebastian Vettel",
  "Nico Rosberg", "Max Verstappen", "Lando Norris",
];

function fail(msg) {
  process.stderr.write(`GOLDEN TEST FAILED: ${msg}\n`);
  process.exit(1);
}

// ---------- load inputs ----------
const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8"))
  .filter((r) => r.series === "Formula 1");
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");
const CUR = Function(`${src}\n;return { DRIVERS, FLAGS };`)();

// ---------- golden tests on the generated pool ----------
if (gen.length < 240 || gen.length > 280) fail(`pool size ${gen.length} outside expected 240-280`);

const genKeys = new Set(gen.map((r) => strip(r.name)));
for (const c of CHAMPIONS_1970_PLUS) {
  if (!genKeys.has(strip(c))) fail(`champion missing from pool: ${c}`);
}
for (const gone of ["Max Jean", "Markus Winkelhock"]) {
  if (genKeys.has(strip(gone))) fail(`one-race driver leaked into pool: ${gone}`);
}
for (const r of gen) {
  if (!r._complete) fail(`incomplete record: ${r.name}`);
  if (!(r._bestSeasonFraction >= FULL_SEASON_FRACTION)) fail(`${r.name} below full-season fraction (${r._bestSeasonFraction})`);
}
const lauda = gen.find((r) => strip(r.name) === strip("Niki Lauda"));
if (!lauda || lauda.titles !== 3 || lauda.wins !== 25) fail(`Lauda spot-check: ${JSON.stringify(lauda)}`);
const seen = new Map();
for (const r of gen) {
  const k = strip(r.name);
  if (seen.has(k)) fail(`duplicate in generated pool: ${r.name} vs ${seen.get(k)}`);
  seen.set(k, r.name);
}

// ---------- carve out preserved / excluded sets ----------
const legendRows = CUR.DRIVERS.filter((d) => d.series === "Formula 1" && LEGENDS.includes(d.name));
if (legendRows.length !== LEGENDS.length) {
  fail(`expected ${LEGENDS.length} preserved legends in data.js, found ${legendRows.length}`);
}

const nonF1 = new Set(CUR.DRIVERS.filter((d) => d.series !== "Formula 1").map((d) => strip(d.name)));
const excluded = gen.filter((r) => nonF1.has(strip(r.name)));
const emit = gen.filter((r) => !nonF1.has(strip(r.name)));

// Any country we're about to emit must have a flag, or the UI degrades.
const missingFlags = [...new Set(emit.map((r) => r.country))].filter((c) => !CUR.FLAGS[c]);
if (missingFlags.length) fail(`countries missing from FLAGS map in data.js: ${missingFlags.join(", ")} — add them first`);

// ---------- rebuild the F1 section ----------
const q = (s) => JSON.stringify(s);
const row = (r) =>
  `  { name: ${q(r.name)}, country: ${q(r.country)}, continent: ${q(r.continent)}, series: SERIES.F1, ` +
  `team: ${q(r.team)}, titles: ${r.titles}, wins: ${r.wins}, status: ${q(r.status)}, debut: ${r.debut} },`;

const tag = gen[0]._source || "f1db";
const today = new Date().toISOString().slice(0, 10);
const block =
  `  // ================= FORMULA 1 =================\n` +
  `  // Generated from F1DB (${tag}, CC BY 4.0 — attribution required, see site footer) on ${today}.\n` +
  `  // Pool = drivers who started >= ${FULL_SEASON_FRACTION * 100}% of a season's rounds (held to date) in some\n` +
  `  // season >= 1970. Regenerate: cd import && node run.js --series=f1 && node merge-f1.js\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n\n" +
  `  // Pre-1970 F1 champions kept by hand (outside the import's 1970+ scope):\n` +
  legendRows.map(row).join("\n") + "\n\n";

const START = "  // ================= FORMULA 1 =================\n";
const END = "  // ================= NASCAR CUP — active =================\n";
const s = src.indexOf(START);
const e = src.indexOf(END);
if (s === -1 || e === -1 || e < s) fail("could not locate F1 section markers in data.js");
src = src.slice(0, s) + block + src.slice(e);

writeFileSync(DATA_JS, src);

// ---------- post-write verification ----------
const OUT = Function(`${src}\n;return DRIVERS;`)();
const f1 = OUT.filter((d) => d.series === "Formula 1");
const dupAll = new Set();
for (const d of OUT) {
  const k = strip(d.name);
  if (dupAll.has(k)) fail(`post-merge duplicate across DB: ${d.name}`);
  dupAll.add(k);
}
console.log(`merged: F1 section = ${f1.length} (${emit.length} generated + ${legendRows.length} legends)`);
console.log(`excluded ${excluded.length} dual-career drivers (kept in their primary series): ${excluded.map((r) => r.name).join(", ")}`);
console.log(`total DRIVERS: ${OUT.length}`);
console.log(`\nAll golden tests passed. Review with: git diff ../data.js`);
