/* Merge the generated modern V8 Supercars set (from
   `node run.js --series=supercars`) into ../data.js, replacing the
   V8 Supercars section. Modern era (2005+) only; pre-2005 ATCC legends
   (Brock, Moffat, Johnson, Richards, Perkins) stay hand-curated.

   Same shape as merge-wrc.js: golden-gated; preserve pre-2005 legends;
   exclude dual-career drivers kept in another primary series
   (McLaughlin→IndyCar, van Gisbergen→NASCAR); MAX(counted, curated)
   wins + curated-debut carryover.

   Usage: node merge-supercars.js
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

const ANCHORS = [["Jamie Whincup", 7], ["Mark Skaife", 5], ["Craig Lowndes", 3]];
const LEGENDS = ["Dick Johnson", "Allan Moffat", "Jim Richards", "Peter Brock", "Larry Perkins"];
/* Career enduro-only co-driver — must NOT appear (proves we read the
   "Driver name" column, not "Endurance entries / Co-driver name"). */
const CODRIVERS = ["Luke Youlden"];

function fail(m) {
  process.stderr.write(`GOLDEN TEST FAILED: ${m}\n`);
  process.exit(1);
}

const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8")).filter((r) => r.series === "V8 Supercars");
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");
const CUR = Function(`${src}\n;return { DRIVERS, FLAGS };`)();
const curByStrip = new Map(CUR.DRIVERS.map((d) => [strip(d.name), d]));

// ---------- golden tests ----------
if (gen.length < 80 || gen.length > 120) fail(`pool size ${gen.length} outside expected 80-120`);
const byStrip = new Map(gen.map((r) => [strip(r.name), r]));
for (const [name, t] of ANCHORS) {
  const r = byStrip.get(strip(name));
  if (!r) fail(`anchor missing: ${name}`);
  if (r.titles !== t) fail(`anchor ${name}: expected ${t} titles, got ${r.titles}`);
}
if (byStrip.get(strip("Jamie Whincup"))?.country !== "Australia") fail("Whincup nationality wrong");
for (const co of CODRIVERS) if (byStrip.has(strip(co))) fail(`enduro co-driver leaked into pool: ${co}`);
for (const r of gen) if (!r._complete) fail(`incomplete record: ${r.name}`);
{
  const seen = new Map();
  for (const r of gen) { const k = strip(r.name); if (seen.has(k)) fail(`dup in pool: ${r.name}`); seen.set(k, r.name); }
}

// ---------- preserve / exclude / carryover ----------
const curSC = CUR.DRIVERS.filter((d) => d.series === "V8 Supercars");
const preserved = curSC.filter((d) => !byStrip.has(strip(d.name)));
for (const name of LEGENDS) if (!preserved.some((d) => strip(d.name) === strip(name))) fail(`legend not preserved: ${name}`);

const nonSC = new Set(CUR.DRIVERS.filter((d) => d.series !== "V8 Supercars").map((d) => strip(d.name)));
const excluded = [];
const emit = [];
for (const orig of gen) {
  if (nonSC.has(strip(orig.name))) { excluded.push(orig); continue; }
  const cur = curByStrip.get(strip(orig.name));
  const rec = { ...orig };
  if (cur) {
    if (cur.debut < rec.debut) rec.debut = cur.debut;
    rec.wins = Math.max(rec.wins, cur.wins); // counted misses pre-2005; curated stales for actives
  }
  emit.push(rec);
}

const missingFlags = [...new Set(emit.map((r) => r.country))].filter((c) => !CUR.FLAGS[c]);
if (missingFlags.length) fail(`countries missing from FLAGS: ${missingFlags.join(", ")}`);

// ---------- rebuild section ----------
const q = (s) => JSON.stringify(s);
const row = (r) =>
  `  { name: ${q(r.name)}, country: ${q(r.country)}, continent: ${q(r.continent)}, series: SERIES.SUPERCARS, ` +
  `team: ${q(r.team)}, titles: ${r.titles}, wins: ${r.wins}, status: ${q(r.status)}, debut: ${r.debut} },`;

const today = new Date().toISOString().slice(0, 10);
const block =
  `  // ================= V8 SUPERCARS =================\n` +
  `  // Modern era (2005+) generated ${today}: roster/teams from Wikipedia season "Teams and\n` +
  `  // drivers" (Driver-name column, Rounds → full-time), race wins counted from season winners,\n` +
  `  // titles from the ATCC champions table, nationality Wikidata (default Australia). Regenerate:\n` +
  `  // cd import && node run.js --series=supercars && node merge-supercars.js\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n\n" +
  `  // Pre-2005 ATCC/Supercars legends kept by hand (outside the modern import scope):\n` +
  preserved.map(row).join("\n") + "\n\n";

const START = "  // ================= V8 SUPERCARS (ATCC lineage) =================\n";
const END = "  // ================= IMSA (top class, incl. Grand-Am era) =================\n";
const s = src.indexOf(START);
const e = src.indexOf(END);
if (s === -1 || e === -1 || e < s) fail("could not locate V8 Supercars section markers");
src = src.slice(0, s) + block + src.slice(e);

writeFileSync(DATA_JS, src);

// ---------- post-write verification ----------
const OUT = Function(`${src}\n;return DRIVERS;`)();
const sc = OUT.filter((d) => d.series === "V8 Supercars");
const dupAll = new Set();
for (const d of OUT) { const k = strip(d.name); if (dupAll.has(k)) fail(`post-merge duplicate across DB: ${d.name}`); dupAll.add(k); }
console.log(`merged: V8 Supercars section = ${sc.length} (${emit.length} modern + ${preserved.length} preserved legends).`);
console.log(`excluded ${excluded.length} dual-career drivers: ${excluded.map((r) => r.name).join(", ") || "(none)"}`);
console.log(`total DRIVERS: ${OUT.length}`);
console.log(`\nAll golden tests passed. Review with: git diff ../data.js`);
