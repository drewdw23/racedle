/* Build or extend the frozen daily-answer calendar (../answers.js).

   Usage (run from import/):
     node build-calendar.js --until=2027-02-01
         Create the calendar, or extend it up to that date. Days already in
         the calendar are never changed.
     node build-calendar.js --until=2027-02-01 --rebuild-from=150
         Regenerate puzzles #150 onward (e.g. after a data refresh drops a
         scheduled driver). Today and earlier can never be rebuilt — players
         have already seen them.

   How answers are chosen (one pick per mode per day, in GENRES order with
   the decade modes first):
   - TIERS / WEIGHTS — each driver gets a weight from how recognizable they
     are: "star" (a Cup title or 10+ wins) = 8, "known" (1-9 wins, or
     currently Active) = 3, "deep cut" (everyone else) = 1. A pick is a
     weighted random draw, so stars come up most often and deep cuts still
     appear now and then.
   - COOLDOWN — a driver can't be a mode's answer again until half that
     mode's pool has passed, capped at 90 days (Ultimate 90, 2020s 8, ...).
   - NO SAME-DAY DOUBLES — Ultimate never repeats one of that day's decade
     answers.
   - TODAY AND EARLIER — never generated. If missing, they're filled with
     the game's built-in seeded pick (what players are already playing), so
     publishing the calendar never changes a live answer.
   Draws use a per-day seeded RNG, so a rebuild of the same range with the
   same data is reproducible. */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_JS = join(__dir, "..", "data.js");
const ANSWERS_JS = join(__dir, "..", "answers.js");

const EPOCH_UTC = Date.UTC(2026, 6, 5); // puzzle #1 — must match game.js
const DAY_MS = 86400000;
const puzzleOn = (ms) => Math.floor((ms - EPOCH_UTC) / DAY_MS) + 1;
const dateOf = (n) => new Date(EPOCH_UTC + (n - 1) * DAY_MS).toISOString().slice(0, 10);

const WEIGHT = { star: 8, known: 3, deep: 1 };
const tierOf = (d) => (d.titles >= 1 || d.wins >= 10 ? "star" : d.wins >= 1 || d.status === "Active" ? "known" : "deep");
const cooldownFor = (pool) => Math.max(1, Math.min(90, Math.floor(pool.length / 2)));

function fail(m) {
  process.stderr.write(`build-calendar: ${m}\n`);
  process.exit(1);
}

// ---------- args ----------
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1];
if (!arg("until")) fail("missing --until=YYYY-MM-DD");
const until = puzzleOn(Date.parse(`${arg("until")}T00:00:00Z`));
const now = new Date();
const today = puzzleOn(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const rebuildFrom = arg("rebuild-from") ? Number(arg("rebuild-from")) : null;
if (rebuildFrom !== null && !(rebuildFrom > today)) fail(`--rebuild-from must be after today (#${today})`);
if (until < today) fail(`--until is before today (#${today})`);

// ---------- data ----------
const { DRIVERS, GENRES } = Function(`${readFileSync(DATA_JS, "utf8")}\n;return { DRIVERS, GENRES };`)();
const decadeOf = (y) => Math.floor(y / 10) * 10;
const poolOf = (g) => (g.decades ? DRIVERS.filter((d) => g.decades.includes(decadeOf(d.debut))) : DRIVERS);
const modes = [...GENRES.filter((g) => g.decades), ...GENRES.filter((g) => !g.decades)]; // decade modes first

// ---------- the game's seeded pick (same math as game.js) ----------
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seededPick = (n, g) => {
  const pool = poolOf(g);
  const seed = (Math.imul(n, 2654435761) ^ hashStr(g.id)) >>> 0;
  return pool[Math.floor(mulberry32(seed)() * pool.length)].name;
};

// ---------- weighted pick with cooldown ----------
function weightedPick(n, g, recent, usedToday) {
  const pool = poolOf(g);
  const blocked = new Set(recent.slice(-cooldownFor(pool)));
  let candidates = pool.filter((d) => !blocked.has(d.name) && !usedToday.has(d.name));
  if (!candidates.length) candidates = pool.filter((d) => !blocked.has(d.name));
  if (!candidates.length) candidates = pool;
  const total = candidates.reduce((s, d) => s + WEIGHT[tierOf(d)], 0);
  let r = mulberry32((Math.imul(n, 2246822519) ^ hashStr(`calendar:${g.id}`)) >>> 0)() * total;
  for (const d of candidates) {
    r -= WEIGHT[tierOf(d)];
    if (r < 0) return d.name;
  }
  return candidates[candidates.length - 1].name;
}

// ---------- load existing calendar ----------
let cal = {};
if (existsSync(ANSWERS_JS)) cal = Function(`${readFileSync(ANSWERS_JS, "utf8")}\n;return ANSWERS;`)();
if (rebuildFrom !== null) for (const k of Object.keys(cal)) if (Number(k) >= rebuildFrom) delete cal[k];
const existing = new Set(Object.keys(cal).map(Number));

// ---------- fill ----------
const first = Math.min(today, ...existing);
const recent = Object.fromEntries(GENRES.map((g) => [g.id, []]));
let generated = 0, seeded = 0;
for (let n = first; n <= until; n++) {
  if (!cal[n] && n < today) continue; // never invent history
  const row = { date: dateOf(n), ...(cal[n] || {}) };
  const usedToday = new Set();
  for (const g of modes) {
    if (!row[g.id]) {
      if (n <= today) { row[g.id] = seededPick(n, g); seeded++; }
      else { row[g.id] = weightedPick(n, g, recent[g.id], usedToday); generated++; }
    }
    usedToday.add(row[g.id]);
    recent[g.id].push(row[g.id]);
  }
  cal[n] = row;
}

// ---------- validate ----------
const byName = new Map(DRIVERS.map((d) => [d.name, d]));
for (const [n, row] of Object.entries(cal)) {
  if (Number(n) < today) continue;
  for (const g of GENRES) {
    const d = byName.get(row[g.id]);
    if (!d || !poolOf(g).includes(d)) fail(`#${n} ${g.id}: "${row[g.id]}" is not in the ${g.label} pool`);
  }
}

// ---------- write ----------
const q = (s) => JSON.stringify(s);
const keys = Object.keys(cal).map(Number).sort((a, b) => a - b);
const lines = keys.map((n) => {
  const row = cal[n];
  return `  ${n}: { date: ${q(row.date)}, ` + GENRES.map((g) => `${q(g.id)}: ${q(row[g.id])}`).join(", ") + " },";
});
writeFileSync(
  ANSWERS_JS,
  `/* ============================================================
   RACEDLE — frozen daily answers (GENERATED — don't hand-edit)
   ------------------------------------------------------------
   Puzzle number -> the answer for each mode that day. The game
   reads its daily answer and "Yesterday's driver" from here, so
   data refreshes no longer change past or upcoming answers. Days
   outside this range fall back to the game's seeded pick.

   Extend / rebuild:  cd import && node build-calendar.js --until=YYYY-MM-DD
   Weighting rules:   see the header of import/build-calendar.js
   ============================================================ */

const ANSWERS = {
${lines.join("\n")}
};
`
);

// ---------- report ----------
console.log(`answers.js: #${keys[0]} (${cal[keys[0]].date}) .. #${keys.at(-1)} (${cal[keys.at(-1)].date}) — ${keys.length} days`);
console.log(`  ${generated} answers generated, ${seeded} kept from the game's current pick (today/past), ${existing.size} days already present\n`);
console.log("mode       pool  cooldown | share of pool (stars/known/deep) | scheduled from tomorrow (stars/known/deep) | most repeats");
for (const g of GENRES) {
  const pool = poolOf(g);
  const pct = (c, t) => `${String(Math.round((100 * c) / t)).padStart(3)}%`;
  const tc = { star: 0, known: 0, deep: 0 };
  pool.forEach((d) => tc[tierOf(d)]++);
  const future = keys.filter((n) => n > today).map((n) => byName.get(cal[n][g.id]));
  const fc = { star: 0, known: 0, deep: 0 };
  future.forEach((d) => fc[tierOf(d)]++);
  const counts = {};
  future.forEach((d) => (counts[d.name] = (counts[d.name] || 0) + 1));
  const maxRep = Math.max(0, ...Object.values(counts));
  console.log(
    `${g.label.padEnd(9)} ${String(pool.length).padStart(5)} ${String(cooldownFor(pool)).padStart(9)} |` +
    `  ${pct(tc.star, pool.length)} ${pct(tc.known, pool.length)} ${pct(tc.deep, pool.length)}` +
    `                 |  ${pct(fc.star, future.length)} ${pct(fc.known, future.length)} ${pct(fc.deep, future.length)}` +
    `                            |  ${maxRep}x`
  );
}
