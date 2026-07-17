/* Merge the generated NASCAR Cup set (output/drivers.generated.json from
   `node run.js --series=nascar`) into ../data.js, replacing the NASCAR
   section. Same shape as merge-f1.js: golden-test-gated; the section is
   entirely generated (1970+ full-time drivers) and excludes dual-career
   drivers kept in another primary series.

   LICENSE: nascaR.data reuse was granted by the maintainer (2026-07-10,
   see PERMISSION_REQUEST.md). Keep the nascaR.data + DriverAverages
   attribution in the site footer while this data ships.

   Usage: node merge-nascar.js   (then review `git diff ../data.js`)
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FULL_SEASON_FRACTION } from "./config.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

/* Cup champions since 1970 — all must survive the full-time filter.
   Exact-name presence was confirmed against the pool during evaluation. */
const CHAMPIONS_1970_PLUS = [
  "Bobby Isaac", "Richard Petty", "Benny Parsons", "Cale Yarborough", "Darrell Waltrip",
  "Terry Labonte", "Bobby Allison", "Dale Earnhardt", "Rusty Wallace", "Alan Kulwicki",
  "Jeff Gordon", "Dale Jarrett", "Bobby Labonte", "Tony Stewart", "Matt Kenseth",
  "Kurt Busch", "Kevin Harvick", "Jimmie Johnson", "Brad Keselowski", "Kyle Busch",
  "Martin Truex Jr.", "Joey Logano", "Chase Elliott", "Kyle Larson", "Ryan Blaney",
];

/* Rock-solid (titles, wins) anchors. */
const ANCHORS = [
  ["Richard Petty", 7, 200], ["Jeff Gordon", 4, 93], ["Jimmie Johnson", 7, 83],
  ["Dale Earnhardt", 7, 76], ["Kyle Larson", 2, 32],
];

function fail(m) {
  process.stderr.write(`GOLDEN TEST FAILED: ${m}\n`);
  process.exit(1);
}

const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8"))
  .filter((r) => r.series === "NASCAR Cup");
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");
const CUR = Function(`${src}\n;return { DRIVERS, FLAGS };`)();

// ---------- golden tests ----------
if (gen.length < 230 || gen.length > 270) fail(`pool size ${gen.length} outside expected 230-270`);
const byStrip = new Map(gen.map((r) => [strip(r.name), r]));
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
if (byStrip.has(strip("Robert Sprague"))) fail("one-race driver leaked into pool");
for (const r of gen) {
  if (!r._complete) fail(`incomplete record: ${r.name}`);
}
const seen = new Map();
for (const r of gen) {
  const k = strip(r.name);
  if (seen.has(k)) fail(`duplicate in pool: ${r.name} vs ${seen.get(k)}`);
  seen.set(k, r.name);
}

// ---------- exclude dual-career drivers ----------
const otherSeries = new Set(CUR.DRIVERS.filter((d) => d.series !== "NASCAR Cup").map((d) => strip(d.name)));
const excluded = gen.filter((r) => otherSeries.has(strip(r.name)));
const emit = gen.filter((r) => !otherSeries.has(strip(r.name)));

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
  `  // Roster/wins/teams from nascaR.data (Cup parquet) on ${today}; titles from the\n` +
  `  // Wikipedia champions list; nationality default US + exceptions. Pool = drivers who\n` +
  `  // started >= ${FULL_SEASON_FRACTION * 100}% of a season's races in some season >= 1970.\n` +
  `  // Regenerate: cd import && node run.js --series=nascar && node merge-nascar.js\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n\n";

// Match either header form (short, or the original "— active"/"…USAC" forms)
// so the merge stays idempotent across re-runs.
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
for (const d of OUT) {
  const k = strip(d.name);
  if (dupAll.has(k)) fail(`post-merge duplicate across DB: ${d.name}`);
  dupAll.add(k);
}
console.log(`merged: NASCAR section = ${nascar.length} (all generated, 1970+ full-time)`);
console.log(`excluded ${excluded.length} dual-career drivers (kept in primary series): ${excluded.map((r) => r.name).join(", ") || "(none)"}`);
console.log(`total DRIVERS: ${OUT.length}`);
console.log(`\nAll golden tests passed. Review with: git diff ../data.js`);
console.log(`Keep the nascaR.data + DriverAverages attribution in the site footer while this ships.`);
