/* Merge the generated NASCAR Cup set (output/drivers.generated.json from
   `node run.js`) into ../data.js, replacing the DRIVERS list.

   The build is self-contained — nothing is carried over from the existing
   data.js. Wikipedia's season pages only cover 1970+ cleanly, so two small
   hardcoded tables fill what those pages can't:
   - LEGENDS: the 36 drivers who debuted before 1970. Their career Cup wins
     and real debut year (counting from 1970 would cut Petty to 99 wins and
     a 1970 debut). Values come from per-race Cup records.
   - TEAM_FALLBACK: older privateers whose season "Teams and drivers" table
     lists no team. Used only when the build found no team.

   Usage: node merge-nascar.js   (then review `git diff ../data.js`)
*/

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

/* Pre-1970 debutants: [career Cup wins, Cup debut year]. These drivers are
   all long retired, so the values are final. */
const LEGENDS = {
  "Richard Petty": [200, 1958],
  "David Pearson": [105, 1960],
  "Bobby Allison": [85, 1961],
  "Cale Yarborough": [83, 1957],
  "Bobby Isaac": [37, 1961],
  "Benny Parsons": [21, 1964],
  "Buddy Baker": [19, 1959],
  "Donnie Allison": [10, 1966],
  "Dave Marcis": [5, 1968],
  "Elmo Langley": [2, 1954],
  "James Hylton": [2, 1964],
  "Dick Brooks": [1, 1969],
  "Lennie Pond": [1, 1969],
  "Wendell Scott": [1, 1961],
  "Ben Arnold": [0, 1968],
  "Bill Champion": [0, 1951],
  "Bill Seifert": [0, 1966],
  "Bill Shirey": [0, 1969],
  "Bob Burcham": [0, 1968],
  "Bobby Wawak": [0, 1965],
  "Buddy Arrington": [0, 1964],
  "Cecil Gordon": [0, 1968],
  "Coo Coo Marlin": [0, 1966],
  "Earl Brooks": [0, 1962],
  "Ed Negre": [0, 1955],
  "Frank Warren": [0, 1963],
  "Friday Hassler": [0, 1960],
  "Henley Gray": [0, 1964],
  "J.D. McDuffie": [0, 1963],
  "Jabe Thomas": [0, 1965],
  "Joe Ruttman": [0, 1963],
  "John Sears": [0, 1964],
  "Neil Castles": [0, 1957],
  "Richard Childress": [0, 1969],
  "Tommy Gale": [0, 1968],
  "Walter Ballard": [0, 1966],
};

/* Last team for drivers whose Wikipedia entry tables list none. */
const TEAM_FALLBACK = {
  "Ben Arnold": "Arnold Racing",
  "Bill Champion": "Champion Racing",
  "Bill Seifert": "Oswald Racing",
  "Bill Shirey": "David Ray Boggs",
  "Bobby Isaac": "Neil Castles",
  "Carl Adams": "Adams Racing",
  "Charlie Roberts": "Roberts Racing",
  "David Ray Boggs": "Warren Racing",
  "David Sisco": "Sisco Racing",
  "Dean Dalton": "Champion Racing",
  "Earl Ross": "DeWitt Racing",
  "Friday Hassler": "Friday Hassler",
  "Henley Gray": "Gray Racing",
  "Jackie Rogers": "Viglione Racing",
  "Janet Guthrie": "McClure Motors",
  "John Sears": "Sears Racing",
  "Larry Smith": "Harley Smith",
  "Neil Castles": "Neil Castles",
  "Raymond Williams": "Bobby Reeves",
  "Richie Panch": "Puro Racing",
  "Ron Keselowski": "Lubinski Racing",
  "Sam Sommers": "Vandiver Racing",
  "Terry Bivins": "H Miller Racing",
  "Vic Parsons": "Strong Racing",
  "Wendell Scott": "Faustina Racing",
};

/* Cup champions since 1970 — all must survive the full-time filter and carry
   >= 1 career title. */
const CHAMPIONS_1970_PLUS = [
  "Bobby Isaac", "Richard Petty", "Benny Parsons", "Cale Yarborough", "Darrell Waltrip",
  "Terry Labonte", "Bobby Allison", "Dale Earnhardt", "Rusty Wallace", "Alan Kulwicki",
  "Jeff Gordon", "Dale Jarrett", "Bobby Labonte", "Tony Stewart", "Matt Kenseth",
  "Kurt Busch", "Kevin Harvick", "Jimmie Johnson", "Brad Keselowski", "Kyle Busch",
  "Martin Truex Jr.", "Joey Logano", "Chase Elliott", "Kyle Larson", "Ryan Blaney",
];

/* Rock-solid (titles, career wins, debut) anchors. */
const ANCHORS = [
  ["Richard Petty", 7, 200, 1958], ["David Pearson", 3, 105, 1960], ["Cale Yarborough", 3, 83, 1957],
  ["Jeff Gordon", 4, 93, 1992], ["Jimmie Johnson", 7, 83, 2001], ["Dale Earnhardt", 7, 76, 1975],
];

function fail(m) {
  process.stderr.write(`GOLDEN TEST FAILED: ${m}\n`);
  process.exit(1);
}

const gen = JSON.parse(readFileSync(join(__dir, "output", "drivers.generated.json"), "utf8"))
  .filter((r) => r.series === "NASCAR Cup");
let src = readFileSync(DATA_JS, "utf8").replace(/\r\n/g, "\n");

// ---------- apply hardcoded tables ----------
const legends = new Map(Object.entries(LEGENDS).map(([n, v]) => [strip(n), v]));
const teams = new Map(Object.entries(TEAM_FALLBACK).map(([n, t]) => [strip(n), t]));
const genKeys = new Set(gen.map((r) => strip(r.name)));
for (const n of [...Object.keys(LEGENDS), ...Object.keys(TEAM_FALLBACK)]) {
  if (!genKeys.has(strip(n))) fail(`hardcoded driver not in the generated pool (renamed or dropped?): ${n}`);
}

const emit = [], dropped = [];
for (const orig of gen) {
  const key = strip(orig.name);
  const rec = { ...orig };
  const legend = legends.get(key);
  if (legend) {
    const [wins, debut] = legend;
    if (rec.wins > wins) fail(`${rec.name}: counted ${rec.wins} wins since 1970 but LEGENDS says ${wins} career`);
    rec.wins = wins;
    rec.debut = debut;
  }
  if (!rec.team && teams.has(key)) rec.team = teams.get(key);
  rec._complete = Boolean(rec.team && Number.isFinite(rec.titles) && Number.isFinite(rec.wins) && rec.status && Number.isFinite(rec.debut));
  if (!rec._complete) { dropped.push(rec); continue; }
  emit.push(rec);
}

// ---------- golden tests ----------
if (emit.length < 240 || emit.length > 290) fail(`pool size ${emit.length} outside expected 240-290`);
const byStrip = new Map(emit.map((r) => [strip(r.name), r]));
for (const c of CHAMPIONS_1970_PLUS) {
  const r = byStrip.get(strip(c));
  if (!r) fail(`champion missing from pool: ${c}`);
  if (!(r.titles >= 1)) fail(`champion ${c} has ${r.titles} titles`);
}
for (const [name, t, w, d] of ANCHORS) {
  const r = byStrip.get(strip(name));
  if (!r || r.titles !== t || r.wins !== w || r.debut !== d) {
    fail(`anchor ${name}: expected ${t}t/${w}w/${d}, got ${r?.titles}t/${r?.wins}w/${r?.debut}`);
  }
}
if (!byStrip.has(strip("Steve Park"))) fail("Steve Park (full-time 1999-2001) missing — venue filter regression?");
for (const junk of ["Infineon Raceway", "Sonoma Raceway"]) if (byStrip.has(strip(junk))) fail(`venue leaked into pool: ${junk}`);
{
  const seen = new Map();
  for (const r of emit) { const k = strip(r.name); if (seen.has(k)) fail(`duplicate in pool: ${r.name} vs ${seen.get(k)}`); seen.set(k, r.name); }
}

// ---------- rebuild the DRIVERS list ----------
const q = (s) => JSON.stringify(s);
const row = (r) =>
  `  { name: ${q(r.name)}, series: SERIES.NASCAR, ` +
  `team: ${q(r.team)}, titles: ${r.titles}, wins: ${r.wins}, status: ${q(r.status)}, debut: ${r.debut} },`;

const today = new Date().toISOString().slice(0, 10);
const block =
  `  // ================= NASCAR CUP =================\n` +
  `  // Generated ${today} from Wikipedia (1970+): roster/teams/status from season "Teams and\n` +
  `  // drivers" + points standings (Starts >= 60% of races = full-time), wins counted from the\n` +
  `  // standings, titles from the champions list.\n` +
  `  // Pre-1970 debutants' career wins/debut are hardcoded in merge-nascar.js (LEGENDS).\n` +
  `  // Regenerate: cd import && node run.js && node merge-nascar.js\n` +
  emit.slice().sort((a, b) => a.name.localeCompare(b.name)).map(row).join("\n") + "\n";

const s = src.indexOf("  // ================= NASCAR CUP =================\n");
const e = s === -1 ? -1 : src.indexOf("\n];", s) + 1;
if (s === -1 || e <= s) fail("could not locate the NASCAR section / end of DRIVERS");
src = src.slice(0, s) + block + src.slice(e);

writeFileSync(DATA_JS, src);

// ---------- post-write verification ----------
const OUT = Function(`${src}\n;return DRIVERS;`)();
const dupAll = new Set();
for (const d of OUT) { const k = strip(d.name); if (dupAll.has(k)) fail(`post-merge duplicate: ${d.name}`); dupAll.add(k); }
console.log(`merged: ${OUT.length} NASCAR drivers (${legends.size} pre-1970 legends hardcoded, ${emit.filter((r) => teams.has(strip(r.name))).length} team fallbacks)`);
console.log(`dropped ${dropped.length} still-incomplete: ${dropped.map((r) => r.name).join(", ") || "(none)"}`);
console.log(`\nAll golden tests passed. Review with: git diff ../data.js`);
