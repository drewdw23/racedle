/* Merge the generated modern-IndyCar set (output/drivers.generated.json
   from `node run.js --series=indycar`) into ../data.js, replacing the
   IndyCar section. Only the modern unified series (2008+) is generated;
   the CART/Champ Car section is left untouched.

   Preserves: current IndyCar drivers NOT in the modern pool — the
   pre-1979 USAC legends (Foyt, the Unsers, Mario Andretti, Rutherford,
   Johncock) and other pre-2008 names.
   Excludes: pool drivers assigned to another primary series (CART
   drivers like Bourdais/Wilson; F1/NASCAR/WEC dual-career drivers).
   Debut carryover: entries only reach 2008, so where a pool driver is
   already curated we keep the curated (real) debut.

   Usage: node merge-indycar.js   (then review `git diff ../data.js`)
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

/* (name, titles, wins) anchors — verified against the sources. */
const ANCHORS = [
  ["Scott Dixon", 6, 59], ["Álex Palou", 4, 23], ["Will Power", 2, 45], ["Josef Newgarden", 2, 34],
];
/* Pre-1979 USAC legends that must survive as preserved (not in the modern pool). */
const LEGENDS = ["A.J. Foyt", "Mario Andretti", "Al Unser", "Bobby Unser", "Johnny Rutherford", "Gordon Johncock"];

function fail(m) {
  process.stderr.write(`GOLDEN TEST FAILED: ${m}\n`);
  process.exit(1);
}

const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8"))
  .filter((r) => r.series === "IndyCar");
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");
const CUR = Function(`${src}\n;return { DRIVERS, FLAGS };`)();
const curByStrip = new Map(CUR.DRIVERS.map((d) => [strip(d.name), d]));

// ---------- golden tests on the pool ----------
if (gen.length < 90 || gen.length > 105) fail(`pool size ${gen.length} outside expected 90-105`);
const byStrip = new Map(gen.map((r) => [strip(r.name), r]));
for (const [name, t, w] of ANCHORS) {
  const r = byStrip.get(strip(name));
  if (!r) fail(`anchor missing from pool: ${name}`);
  if (r.titles !== t || r.wins !== w) fail(`anchor ${name}: expected ${t}t/${w}w, got ${r.titles}t/${r.wins}w`);
}
if (byStrip.get(strip("Scott Dixon"))?.country !== "New Zealand") fail("Dixon nationality wrong");
for (const r of gen) if (!r._complete) fail(`incomplete record: ${r.name}`);
{
  const seen = new Map();
  for (const r of gen) { const k = strip(r.name); if (seen.has(k)) fail(`dup in pool: ${r.name}`); seen.set(k, r.name); }
}

// ---------- carve preserve / exclude, apply debut carryover ----------
const curIndy = CUR.DRIVERS.filter((d) => d.series === "IndyCar");
const preserved = curIndy.filter((d) => !byStrip.has(strip(d.name)));
for (const name of LEGENDS) if (!preserved.some((d) => strip(d.name) === strip(name))) fail(`legend not preserved: ${name}`);

const nonIndySameName = new Set(
  CUR.DRIVERS.filter((d) => d.series !== "IndyCar").map((d) => strip(d.name))
);
const excluded = [];
const emit = [];
for (const orig of gen) {
  if (nonIndySameName.has(strip(orig.name))) { excluded.push(orig); continue; } // keep in their primary series
  const cur = curByStrip.get(strip(orig.name));
  // entries only reach 2008; use the curated (real) debut where earlier.
  const rec = cur && cur.debut < orig.debut ? { ...orig, debut: cur.debut } : orig;
  emit.push(rec);
}

const missingFlags = [...new Set(emit.map((r) => r.country))].filter((c) => !CUR.FLAGS[c]);
if (missingFlags.length) fail(`countries missing from FLAGS: ${missingFlags.join(", ")} — add them first`);

// CART section must be untouched.
const cartBefore = CUR.DRIVERS.filter((d) => d.series === "CART / Champ Car").length;

// ---------- rebuild the IndyCar section ----------
const q = (s) => JSON.stringify(s);
const row = (r) =>
  `  { name: ${q(r.name)}, country: ${q(r.country)}, continent: ${q(r.continent)}, series: SERIES.INDYCAR, ` +
  `team: ${q(r.team)}, titles: ${r.titles}, wins: ${r.wins}, status: ${q(r.status)}, debut: ${r.debut} },`;

const today = new Date().toISOString().slice(0, 10);
const block =
  `  // ================= INDYCAR =================\n` +
  `  // Modern unified series (2008+) generated ${today}: roster/teams from Wikipedia season\n` +
  `  // "Confirmed entries" (Round(s) column → full-time only), wins from the Championship Car\n` +
  `  // winners list, titles from the champions list (IndyCar lineage 1996+), nationality from\n` +
  `  // Wikidata. Regenerate: cd import && node run.js --series=indycar && node merge-indycar.js\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n\n" +
  `  // Pre-2008 / pre-1979 USAC IndyCar drivers kept by hand (outside the modern import scope):\n` +
  preserved.map(row).join("\n") + "\n\n";

const START = "  // ================= INDYCAR (modern series + pre-1979 USAC) =================\n";
const END = "  // ================= CART / CHAMP CAR (peak 1979–2007) =================\n";
const s = src.indexOf(START);
const e = src.indexOf(END);
if (s === -1 || e === -1 || e < s) fail("could not locate IndyCar section markers");
src = src.slice(0, s) + block + src.slice(e);

writeFileSync(DATA_JS, src);

// ---------- post-write verification ----------
const OUT = Function(`${src}\n;return DRIVERS;`)();
const indy = OUT.filter((d) => d.series === "IndyCar");
const cartAfter = OUT.filter((d) => d.series === "CART / Champ Car").length;
if (cartAfter !== cartBefore) fail(`CART section changed (${cartBefore} → ${cartAfter})`);
const dupAll = new Set();
for (const d of OUT) { const k = strip(d.name); if (dupAll.has(k)) fail(`post-merge duplicate across DB: ${d.name}`); dupAll.add(k); }

const debutFloored = emit.filter((r) => r.debut === 2008 && !curByStrip.has(strip(r.name)));
console.log(`merged: IndyCar section = ${indy.length} (${emit.length} modern + ${preserved.length} preserved); CART untouched (${cartAfter}).`);
console.log(`excluded ${excluded.length} dual-career drivers (kept in primary series): ${excluded.map((r) => r.name).join(", ")}`);
console.log(`total DRIVERS: ${OUT.length}`);
if (debutFloored.length) console.log(`note: ${debutFloored.length} new drivers debut=2008 from the entries floor (all debuted in the 2000s decade, so the game's Decade tile is unaffected): ${debutFloored.map((r) => r.name).join(", ")}`);
console.log(`\nAll golden tests passed. Review with: git diff ../data.js`);
