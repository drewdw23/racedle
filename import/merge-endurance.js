/* Merge a generated endurance set (WEC or IMSA) into ../data.js,
   replacing that series' section. Shared for both series:
     node merge-endurance.js --series=wec
     node merge-endurance.js --series=imsa

   Modern era only (WEC 2012+, IMSA 2014+); pre-modern legends
   (pre-2012 WSC / pre-2014 IMSA GT) are preserved. Dual-career drivers
   assigned to another primary series are excluded. Titles come from the
   hardcoded champions map (see config.js); wins default to 0 (documented
   endurance gap) and take MAX(0, curated) so hand-curated winners keep
   their wins. Debut carried over from curated where earlier.

   NOTE: the Endurance genre is hidden in the game for now (later
   release), but the data is kept current here. */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

const SERIES = {
  wec: {
    label: "WEC", CONST: "SERIES.WEC",
    startRes: ["  // ================= WEC =================\n", "  // ================= WEC (incl. pre-2012 World Sportscar legends) =================\n"],
    endRes: ["  // ================= WRC =================\n"],
    anchors: [["Sébastien Buemi", 4], ["Brendon Hartley", 4]],
    natCheck: ["Sébastien Buemi", "Switzerland"],
  },
  imsa: {
    label: "IMSA", CONST: "SERIES.IMSA",
    startRes: ["  // ================= IMSA =================\n", "  // ================= IMSA (top class, incl. Grand-Am era) =================\n"],
    endRes: ["  // ================= WEC =================\n", "  // ================= WEC (incl. pre-2012 World Sportscar legends) =================\n"],
    anchors: [["Dane Cameron", 3], ["Felipe Nasr", 3]],
    natCheck: ["Pipo Derani", "Brazil"],
  },
};

function fail(m) { process.stderr.write(`GOLDEN TEST FAILED: ${m}\n`); process.exit(1); }
const findAny = (src, ms) => ms.map((m) => src.indexOf(m)).find((i) => i !== -1);

const sid = (process.argv.find((a) => a.startsWith("--series=")) || "").split("=")[1];
const S = SERIES[sid];
if (!S) fail(`usage: node merge-endurance.js --series=wec|imsa`);

const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8")).filter((r) => r.series === S.label);
if (!gen.length) fail(`no ${S.label} records in output — run: node run.js --series=${sid}`);
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");
const CUR = Function(`${src}\n;return { DRIVERS, FLAGS };`)();
const curByStrip = new Map(CUR.DRIVERS.map((d) => [strip(d.name), d]));

// ---------- golden tests ----------
if (gen.length < 30 || gen.length > 200) fail(`pool size ${gen.length} outside expected 30-200`);
const byStrip = new Map(gen.map((r) => [strip(r.name), r]));
for (const [name, t] of S.anchors) {
  const r = byStrip.get(strip(name));
  if (!r) fail(`anchor missing from pool: ${name}`);
  if (r.titles !== t) fail(`anchor ${name}: expected ${t} titles, got ${r.titles}`);
}
if (byStrip.get(strip(S.natCheck[0]))?.country !== S.natCheck[1]) fail(`${S.natCheck[0]} nationality != ${S.natCheck[1]}`);
for (const r of gen) if (!r._complete) fail(`incomplete record: ${r.name}`);
{ const seen = new Map(); for (const r of gen) { const k = strip(r.name); if (seen.has(k)) fail(`dup in pool: ${r.name}`); seen.set(k, r.name); } }

// ---------- preserve / exclude / carryover ----------
const curSeries = CUR.DRIVERS.filter((d) => d.series === S.label);
const preserved = curSeries.filter((d) => !byStrip.has(strip(d.name)));
const otherSeries = new Set(CUR.DRIVERS.filter((d) => d.series !== S.label).map((d) => strip(d.name)));
const excluded = [];
const emit = [];
for (const orig of gen) {
  if (otherSeries.has(strip(orig.name))) { excluded.push(orig); continue; }
  const cur = curByStrip.get(strip(orig.name));
  const rec = { ...orig };
  if (cur) {
    if (cur.debut < rec.debut) rec.debut = cur.debut;
    rec.wins = Math.max(rec.wins, cur.wins);       // wins gap: keep curated winners' wins
    rec.titles = Math.max(rec.titles, cur.titles); // keep any pre-modern titles curated
  }
  emit.push(rec);
}
const missingFlags = [...new Set(emit.map((r) => r.country))].filter((c) => !CUR.FLAGS[c]);
if (missingFlags.length) fail(`countries missing from FLAGS: ${missingFlags.join(", ")}`);

// ---------- rebuild the section ----------
const q = (s) => JSON.stringify(s);
const row = (r) =>
  `  { name: ${q(r.name)}, country: ${q(r.country)}, continent: ${q(r.continent)}, series: ${S.CONST}, ` +
  `team: ${q(r.team)}, titles: ${r.titles}, wins: ${r.wins}, status: ${q(r.status)}, debut: ${r.debut} },`;

const today = new Date().toISOString().slice(0, 10);
const block =
  `  // ================= ${S.label} =================\n` +
  `  // Modern top class generated ${today}: roster/full-time/team from Wikipedia season entries\n` +
  `  // (Rounds column), titles from the hardcoded champions map, nationality Wikidata. Wins are a\n` +
  `  // documented gap (0 for new drivers; curated winners kept). Regenerate: cd import &&\n` +
  `  // node run.js --series=${sid} && node merge-endurance.js --series=${sid}\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n\n" +
  `  // Pre-modern ${S.label} legends kept by hand (outside the modern import scope):\n` +
  preserved.map(row).join("\n") + "\n\n";

const s = findAny(src, S.startRes);
const e = findAny(src, S.endRes);
if (s == null || e == null || e < s) fail(`could not locate ${S.label} section markers`);
src = src.slice(0, s) + block + src.slice(e);

writeFileSync(DATA_JS, src);

// ---------- post-write verification ----------
const OUT = Function(`${src}\n;return DRIVERS;`)();
const sec = OUT.filter((d) => d.series === S.label);
const dupAll = new Set();
for (const d of OUT) { const k = strip(d.name); if (dupAll.has(k)) fail(`post-merge duplicate across DB: ${d.name}`); dupAll.add(k); }
console.log(`merged: ${S.label} section = ${sec.length} (${emit.length} modern + ${preserved.length} preserved).`);
console.log(`excluded ${excluded.length} dual-career drivers: ${excluded.map((r) => r.name).join(", ") || "(none)"}`);
console.log(`total DRIVERS: ${OUT.length}`);
console.log(`\nAll golden tests passed. (Endurance genre is hidden in-game for now.)`);
