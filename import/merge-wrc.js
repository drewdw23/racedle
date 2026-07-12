/* Merge the generated modern-WRC set (output/drivers.generated.json from
   `node run.js --series=wrc`) into ../data.js, replacing the WRC section
   (the last section in the DRIVERS array).

   Modern WRC (2014+) only; pre-2014 legends stay hand-curated and are
   preserved. Carryovers for drivers already curated:
   - debut: entries only reach 2014, so keep the curated (real) debut.
   - wins: counted wins miss pre-2014 rallies (2010–13 pages don't parse)
     and curated wins go stale for active drivers, so take MAX(counted,
     curated) — correct in both directions (Ogier 68 curated > 37 counted;
     Rovanperä 18 counted > 15 curated).

   Usage: node merge-wrc.js   (then review `git diff ../data.js`)
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

const ANCHORS = [["Sébastien Ogier", 9], ["Kalle Rovanperä", 2], ["Ott Tänak", 1], ["Thierry Neuville", 1]];
const LEGENDS = ["Sebastien Loeb", "Colin McRae", "Tommi Makinen", "Juha Kankkunen", "Carlos Sainz Sr", "Marcus Gronholm"];
/* Well-known co-drivers that must NOT appear (proves the driver/co-driver split held). */
const CODRIVERS = ["Julien Ingrassia", "Daniel Elena", "Scott Martin", "Martijn Wydaeghe", "Jonne Halttunen"];

function fail(m) {
  process.stderr.write(`GOLDEN TEST FAILED: ${m}\n`);
  process.exit(1);
}

const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8")).filter((r) => r.series === "WRC");
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");
const CUR = Function(`${src}\n;return { DRIVERS, FLAGS };`)();
const curByStrip = new Map(CUR.DRIVERS.map((d) => [strip(d.name), d]));

// ---------- golden tests on the pool ----------
if (gen.length < 20 || gen.length > 40) fail(`pool size ${gen.length} outside expected 20-40`);
const byStrip = new Map(gen.map((r) => [strip(r.name), r]));
for (const [name, t] of ANCHORS) {
  const r = byStrip.get(strip(name));
  if (!r) fail(`anchor missing: ${name}`);
  if (r.titles !== t) fail(`anchor ${name}: expected ${t} titles, got ${r.titles}`);
}
if (byStrip.get(strip("Sébastien Ogier"))?.country !== "France") fail("Ogier nationality wrong");
for (const co of CODRIVERS) if (byStrip.has(strip(co))) fail(`co-driver leaked into pool: ${co}`);

// ---------- carve preserve / exclude, apply carryovers ----------
const curWRC = CUR.DRIVERS.filter((d) => d.series === "WRC");
const preserved = curWRC.filter((d) => !byStrip.has(strip(d.name)));
for (const name of LEGENDS) if (!preserved.some((d) => strip(d.name) === strip(name))) fail(`legend not preserved: ${name}`);

const nonWRC = new Set(CUR.DRIVERS.filter((d) => d.series !== "WRC").map((d) => strip(d.name)));
const excluded = [];
const emit = [];
for (const orig of gen) {
  if (nonWRC.has(strip(orig.name))) { excluded.push(orig); continue; }
  const cur = curByStrip.get(strip(orig.name));
  const rec = { ...orig };
  if (cur) {
    if (cur.debut < rec.debut) rec.debut = cur.debut; // real pre-2014 debut
    rec.wins = Math.max(rec.wins, cur.wins); // counted misses pre-2014; curated goes stale
  }
  emit.push(rec);
}

// complete check AFTER carryover (Luxembourg etc. must resolve)
for (const r of emit) if (!(r.country && r.continent && r.team)) fail(`incomplete record: ${r.name} (${r.country}/${r.continent}/${r.team})`);
const missingFlags = [...new Set(emit.map((r) => r.country))].filter((c) => !CUR.FLAGS[c]);
if (missingFlags.length) fail(`countries missing from FLAGS: ${missingFlags.join(", ")}`);

// ---------- rebuild the WRC section (last in the array) ----------
const q = (s) => JSON.stringify(s);
const row = (r) =>
  `  { name: ${q(r.name)}, country: ${q(r.country)}, continent: ${q(r.continent)}, series: SERIES.WRC, ` +
  `team: ${q(r.team)}, titles: ${r.titles}, wins: ${r.wins}, status: ${q(r.status)}, debut: ${r.debut} },`;

const today = new Date().toISOString().slice(0, 10);
const block =
  `  // ================= WRC =================\n` +
  `  // Modern WRC (2014+) generated ${today}: roster/teams from Wikipedia season "Teams and\n` +
  `  // drivers" (Driver column, Rounds → full-time), wins counted from per-rally winners, titles\n` +
  `  // from the champions table, nationality from Wikidata. Regenerate: cd import &&\n` +
  `  // node run.js --series=wrc && node merge-wrc.js\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n\n" +
  `  // Pre-2014 WRC legends kept by hand (outside the modern import scope):\n` +
  preserved.map(row).join("\n") + "\n";

const START = "  // ================= WRC =================\n";
const s = src.indexOf(START);
const closeIdx = src.indexOf("\n];", s); // newline before the DRIVERS array close
if (s === -1 || closeIdx === -1) fail("could not locate WRC section / array close");
src = src.slice(0, s) + block + src.slice(closeIdx + 1);

writeFileSync(DATA_JS, src);

// ---------- post-write verification ----------
const OUT = Function(`${src}\n;return DRIVERS;`)();
const wrc = OUT.filter((d) => d.series === "WRC");
const dupAll = new Set();
for (const d of OUT) { const k = strip(d.name); if (dupAll.has(k)) fail(`post-merge duplicate across DB: ${d.name}`); dupAll.add(k); }
console.log(`merged: WRC section = ${wrc.length} (${emit.length} modern + ${preserved.length} preserved legends).`);
console.log(`excluded ${excluded.length} dual-career drivers: ${excluded.map((r) => r.name).join(", ") || "(none)"}`);
console.log(`wins carried up (MAX): ${emit.filter((r) => curByStrip.has(strip(r.name)) && r.wins > (gen.find((g) => strip(g.name) === strip(r.name))?.wins ?? 0)).map((r) => r.name + "→" + r.wins).join(", ")}`);
console.log(`total DRIVERS: ${OUT.length}`);
console.log(`\nAll golden tests passed. Review with: git diff ../data.js`);
