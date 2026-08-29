/* Merge the generated NASCAR Cup set (output/drivers.generated.json from
   `node run.js --series=nascar`) into ../data.js, replacing the NASCAR section.

   Source reworked 2026 to license-clean Wikipedia/Wikidata (no external data
   dependency); see sources/nascar.js. The set is built fresh from 1970+ season
   pages (roster, teams, status, nationality, titles, and 1970+ wins/debut).

   CARRYOVER (same shape as merge-supercars.js): Wikipedia season pages only
   go back to 1970 cleanly, so for the ~15 drivers who debuted and won most of
   their races BEFORE 1970 (Petty, Pearson, Cale, …) their full-career wins and
   real debut are carried from the outgoing verified data via MAX(wins)/
   MIN(debut); a missing team also falls back to the outgoing record. Titles
   already come career-complete from the champions list. Dual-career drivers
   kept in another primary series are excluded.

   Usage: node merge-nascar.js   (then review `git diff ../data.js`)
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

/* Cup champions since 1970 — all must survive the full-time filter and carry
   >= 1 career title. */
const CHAMPIONS_1970_PLUS = [
  "Bobby Isaac", "Richard Petty", "Benny Parsons", "Cale Yarborough", "Darrell Waltrip",
  "Terry Labonte", "Bobby Allison", "Dale Earnhardt", "Rusty Wallace", "Alan Kulwicki",
  "Jeff Gordon", "Dale Jarrett", "Bobby Labonte", "Tony Stewart", "Matt Kenseth",
  "Kurt Busch", "Kevin Harvick", "Jimmie Johnson", "Brad Keselowski", "Kyle Busch",
  "Martin Truex Jr.", "Joey Logano", "Chase Elliott", "Kyle Larson", "Ryan Blaney",
];

/* Rock-solid (titles, career wins) anchors — the win totals prove the pre-1970
   carryover fired (Petty's 200 include his 1960s wins). */
const ANCHORS = [
  ["Richard Petty", 7, 200], ["Jeff Gordon", 4, 93], ["Jimmie Johnson", 7, 83],
  ["Dale Earnhardt", 7, 76], ["David Pearson", 3, 105], ["Cale Yarborough", 3, 83],
];

function fail(m) {
  process.stderr.write(`GOLDEN TEST FAILED: ${m}\n`);
  process.exit(1);
}

const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8"))
  .filter((r) => r.series === "NASCAR Cup");
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");
const CUR = Function(`${src}\n;return { DRIVERS, FLAGS };`)();
const curNascar = new Map(CUR.DRIVERS.filter((d) => d.series === "NASCAR Cup").map((d) => [strip(d.name), d]));
const otherSeries = new Set(CUR.DRIVERS.filter((d) => d.series !== "NASCAR Cup").map((d) => strip(d.name)));

// ---------- carryover + dual-career exclusion ----------
const emit = [], dropped = [], excluded = [];
for (const orig of gen) {
  if (otherSeries.has(strip(orig.name))) { excluded.push(orig); continue; } // kept in primary series
  const cur = curNascar.get(strip(orig.name));
  const rec = { ...orig };
  if (cur) {
    rec.wins = Math.max(rec.wins, cur.wins);   // pre-1970 career wins the 1970+ count can't see
    rec.debut = Math.min(rec.debut, cur.debut); // real (pre-1970) debut decade
    if (!rec.team) rec.team = cur.team;         // old privateers whose entry table gave no team
  }
  rec._complete = Boolean(rec.country && rec.continent && rec.team && Number.isFinite(rec.titles) && Number.isFinite(rec.wins) && rec.status && Number.isFinite(rec.debut));
  if (!rec._complete) { dropped.push(rec); continue; }
  emit.push(rec);
}

// ---------- golden tests (after carryover) ----------
if (emit.length < 240 || emit.length > 290) fail(`pool size ${emit.length} outside expected 240-290`);
const byStrip = new Map(emit.map((r) => [strip(r.name), r]));
for (const c of CHAMPIONS_1970_PLUS) {
  const r = byStrip.get(strip(c));
  if (!r) fail(`champion missing from pool: ${c}`);
  if (!(r.titles >= 1)) fail(`champion ${c} has ${r.titles} titles`);
}
for (const [name, t, w] of ANCHORS) {
  const r = byStrip.get(strip(name));
  if (!r || r.titles !== t || r.wins !== w) fail(`anchor ${name}: expected ${t}t/${w}w, got ${r?.titles}t/${r?.wins}w`);
}
if (byStrip.get(strip("Shane van Gisbergen"))?.country !== "New Zealand") fail("SVG nationality wrong");
if (!byStrip.has(strip("Steve Park"))) fail("Steve Park (full-time 1999-2001) missing — venue filter regression?");
for (const junk of ["Infineon Raceway", "Sonoma Raceway"]) if (byStrip.has(strip(junk))) fail(`venue leaked into pool: ${junk}`);
{
  const seen = new Map();
  for (const r of emit) { const k = strip(r.name); if (seen.has(k)) fail(`duplicate in pool: ${r.name} vs ${seen.get(k)}`); seen.set(k, r.name); }
}
const missingFlags = [...new Set(emit.map((r) => r.country))].filter((c) => !CUR.FLAGS[c]);
if (missingFlags.length) fail(`countries missing from FLAGS: ${missingFlags.join(", ")} — add them first`);

// ---------- rebuild section ----------
const q = (s) => JSON.stringify(s);
const row = (r) =>
  `  { name: ${q(r.name)}, country: ${q(r.country)}, continent: ${q(r.continent)}, series: SERIES.NASCAR, ` +
  `team: ${q(r.team)}, titles: ${r.titles}, wins: ${r.wins}, status: ${q(r.status)}, debut: ${r.debut} },`;

const today = new Date().toISOString().slice(0, 10);
const block =
  `  // ================= NASCAR CUP =================\n` +
  `  // Generated ${today} from Wikipedia/Wikidata (1970+): roster/teams/status from season\n` +
  `  // "Teams and drivers" + points standings (Starts >= 60% of races = full-time), wins\n` +
  `  // counted from the standings, titles from the champions list, nationality default US +\n` +
  `  // exceptions. Full-career wins/debut for pre-1970 legends carried from the prior data.\n` +
  `  // Regenerate: cd import && node run.js --series=nascar && node merge-nascar.js\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n\n";

// Match either header form so the merge stays idempotent across re-runs.
const findAny = (...ms) => ms.map((m) => src.indexOf(m)).find((i) => i !== -1);
const s = findAny("  // ================= NASCAR CUP =================\n", "  // ================= NASCAR CUP — active =================\n");
const e = findAny("  // ================= INDYCAR =================\n", "  // ================= INDYCAR (modern series + pre-1979 USAC) =================\n");
if (s == null || s === -1 || e == null || e === -1 || e < s) fail("could not locate NASCAR section markers");
src = src.slice(0, s) + block + src.slice(e);

writeFileSync(DATA_JS, src);

// ---------- post-write verification ----------
const OUT = Function(`${src}\n;return DRIVERS;`)();
const nascar = OUT.filter((d) => d.series === "NASCAR Cup");
const dupAll = new Set();
for (const d of OUT) { const k = strip(d.name); if (dupAll.has(k)) fail(`post-merge duplicate across DB: ${d.name}`); dupAll.add(k); }
console.log(`merged: NASCAR section = ${nascar.length} (fresh Wikipedia 1970+, career wins/debut carried for legends)`);
console.log(`excluded ${excluded.length} dual-career (kept in primary series): ${excluded.map((r) => r.name).join(", ") || "(none)"}`);
console.log(`dropped ${dropped.length} still-incomplete: ${dropped.map((r) => r.name).join(", ") || "(none)"}`);
console.log(`total DRIVERS: ${OUT.length}`);
console.log(`\nAll golden tests passed. Review with: git diff ../data.js`);
