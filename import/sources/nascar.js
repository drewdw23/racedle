/* NASCAR Cup source — license-clean Wikipedia (CC BY-SA), see DATA_SOURCES.md.
   No external data dependency (replaced the nascaR.data parquet in 2026).

   Scope is 1970→now — the project's established floor (pre-1970 seasons are
   out of scope, and Wikipedia's pre-1972 season pages are inconsistent anyway;
   the pre-1970 legends' career wins/debuts are hardcoded in merge-nascar.js).
   Per season page ("YYYY NASCAR <era-name> Series"):
   - full-time + wins ← the points-STANDINGS table, in either of two layouts:
       · summary (early-70s): a starts count ("Starts"/"St"/"Races") + "Wins".
       · modern grid: one column per race; a started race is a non-empty
         result cell, a win is a finish of "1". races = race-column count.
         Non-points columns (Duels/Clash) and spanning footnote rows are
         skipped.
     Full-time season = Starts >= FULL_SEASON_FRACTION x races.
     Wins = sum across 1970+ seasons, cross-checked (merge-nascar.js) against
     the "List of all-time NASCAR Cup Series winners".
   - team ← the driver's own article: its Cup results table, final season
     with a start, the team with the most starts that season (ties -> the
     later team). Falls back to the season "Teams and drivers" table
     (Driver->Team, most-recent season) when the article has no such table.
   - debut ← earliest 1970+ standings appearance.
   - titles ← Wikipedia "List of NASCAR Cup Series champions" (chronological,
     distinct years — the old rows rowspan-duplicate otherwise).

   Pool = drivers with a full-time season in some year >= YEAR_FROM (1970). */

import { resolveTitle, getFullPageHtml, parseTables } from "../lib/wikipedia.js";
import { inferStatus } from "../lib/normalize.js";
import { YEAR_FROM, FULL_SEASON_FRACTION } from "../config.js";

const HISTORY_FROM = YEAR_FROM; // 1970 — the project's roster/stat floor; older seasons are out of scope

const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();
const cleanName = (s) => s.replace(/\s*\([^)]*\)\s*$/, "").trim();
const NON_DRIVER = /\b(raceway|speedway|superspeedway|dragway|motor speedway)\b/i; // venue names that leak in as "drivers"
const plausible = (s) => /^[\p{L}][\p{L}\p{M}.'-]*(?:\s+[\p{L}][\p{L}\p{M}.'-]*)+$/u.test(s) && !/\d/.test(s) && !NON_DRIVER.test(s);

const titleCands = (y) => [
  `${y} NASCAR Cup Series`,
  `${y} NASCAR Sprint Cup Series`,
  `${y} NASCAR Nextel Cup Series`,
  `${y} NASCAR Winston Cup Series`,
  `${y} NASCAR Winston Cup Grand National Series`,
  `${y} NASCAR Grand National Series`,
];

/* Resolve the season article, requiring the year in the resolved title:
   "1968 NASCAR Cup Series" is a redirect to the generic (yearless) "NASCAR
   Cup Series" page, which we must reject and fall through to the era name. */
async function resolveSeasonTitle(y) {
  for (const cand of titleCands(y)) {
    const resolved = await resolveTitle([cand]);
    if (resolved && resolved.includes(String(y))) return resolved;
  }
  return null;
}

/* Combine the leading run of header rows into one lowercased header per
   column (and the article titles those header cells link to), returning
   the first data-row index too. */
function headerCols(t) {
  const hrs = [];
  for (const r of t) { if (r.filter((c) => c.header).length >= r.length / 2) hrs.push(r); else break; }
  if (!hrs.length) hrs.push(t[0]);
  const width = Math.max(...t.map((r) => r.length));
  const cols = [], refs = [];
  for (let i = 0; i < width; i++) {
    cols[i] = hrs.map((r) => (r[i] ? r[i].text.toLowerCase() : "")).join(" ").trim();
    refs[i] = hrs.flatMap((r) => (r[i] ? r[i].links : [])).join(" ").toLowerCase();
  }
  return { cols, refs, dataFrom: t.indexOf(hrs[hrs.length - 1]) + 1 };
}

const nameFromCell = (cell) => {
  const raw = cell?.links?.length ? cell.links[0] : cell?.text;
  return raw ? cleanName(raw) : null;
};

/* Non-points races that some seasons list in the standings grid (2017 shows
   the two Can-Am Duels as "D1"/"D2" under DAY). A Duel or Clash win is not
   an official Cup win, so those columns are skipped entirely. */
const EXHIBITION = /\bduels?\b|\bclash\b|\bunlimited\b|\bshootout\b|all-star/i;

/* A footnote under the standings is one cell spanning every column. If it
   mentions a driver ("1 Due to neck spasms Denny Hamlin …") it would read as
   that driver's row, with a "1" (a win) in every race column. */
const isSpanningRow = (row, di) => row[di] && row[di] === row[di + 1];

/* Keep a driver's fuller row if a name appears twice in one table. */
function keep(out, key, rec) {
  const prev = out.get(key);
  if (!prev || rec.starts > prev.starts) out.set(key, rec);
}

/* From all tables on a season page, read the points standings: per driver
   { starts, wins } plus the season's race count. Handles both the summary
   layout (Starts/Wins columns) and the modern per-race grid. Returns the
   best (most drivers) parse, or null. */
function parseStandings(tabs) {
  let best = null;
  for (const t of tabs) {
    const { cols, refs, dataFrom } = headerCols(t);
    const di = cols.findIndex((c) => /\bdriver\b/.test(c) && !/crew/.test(c));
    if (di === -1 || t.length - dataFrom < 8) continue;

    // Summary layout carries a starts count (modern "Starts", older "St" or
    // "Races") alongside a finish/points-summary signature ("T5"/"T10"/…).
    const si = cols.findIndex((c) => /\bstarts\b|\bst\b|\braces\b/.test(c));
    const summarySig = cols.some((c) => /\bt5\b|top ?5|\bt10\b|top ?10|\bfin\b|\bfinish\b|\bpoles?\b/.test(c));
    let out = new Map(), races = 0;

    if (si !== -1 && summarySig) {
      // ---- summary format: explicit Starts / Wins columns ----
      const wi = cols.findIndex((c) => /\bwins\b|\bw\b/.test(c));
      for (let i = dataFrom; i < t.length; i++) {
        if (isSpanningRow(t[i], di)) continue;
        const name = nameFromCell(t[i][di]);
        if (!name || !plausible(name)) continue;
        const starts = parseInt((t[i][si]?.text || "").replace(/[^\d]/g, ""), 10) || 0;
        const wins = wi !== -1 ? parseInt((t[i][wi]?.text || "").replace(/[^\d]/g, ""), 10) || 0 : 0;
        races = Math.max(races, starts);
        keep(out, strip(name), { name, starts, wins, title: t[i][di]?.links?.[0] || null });
      }
    } else {
      // ---- modern grid: race columns sit between Driver and Points ----
      const pi = cols.findIndex((c, idx) => idx > di && /\bpoints\b|^pts\b|\bpts\.?$/.test(c));
      if (pi === -1 || pi - di - 1 < 5) continue;
      const raceCols = [];
      for (let c = di + 1; c < pi; c++) if (!EXHIBITION.test(`${cols[c]} ${refs[c]}`)) raceCols.push(c);
      races = raceCols.length;
      for (let i = dataFrom; i < t.length; i++) {
        if (isSpanningRow(t[i], di)) continue;
        const name = nameFromCell(t[i][di]);
        if (!name || !plausible(name)) continue;
        let starts = 0, wins = 0;
        for (const c of raceCols) {
          const v = (t[i][c]?.text || "").trim();
          if (!v || /^[–—-]$/.test(v)) continue;
          const m = v.match(/^(\d+)/);
          if (m) { starts++; if (m[1] === "1") wins++; }
          else if (/^(dnf|dns|dnq|wd|w\/d|c|dsq)\b/i.test(v)) starts++;
        }
        if (starts === 0) continue;
        keep(out, strip(name), { name, starts, wins, title: t[i][di]?.links?.[0] || null });
      }
    }
    if (out.size && (!best || out.size > best.drivers.size)) best = { drivers: out, races };
  }
  return best;
}

/* Driver -> team from the "Teams and drivers" entry table(s). Identified by a
   Driver column alongside the entry-table signature (Team + Manufacturer/Crew/
   No.), so the standings grid is never mistaken for it. */
function parseTeams(tabs) {
  const map = new Map();
  for (const t of tabs) {
    const { cols, dataFrom } = headerCols(t);
    const di = cols.findIndex((c) => c.includes("driver") && !c.includes("crew"));
    const ti = cols.findIndex((c) => /\bteam\b|\bowner\b/.test(c));
    if (di === -1 || ti === -1) continue; // driver + team columns = an entry table (standings has no team col)
    for (let i = dataFrom; i < t.length; i++) {
      const cell = t[i][di];
      if (!cell || cell.header) continue;
      const team = cleanTeam(t[i][ti]?.text) || cleanTeam(t[i][ti]?.links?.[0]); // display text, as the page shows it
      if (!team) continue;
      const names = cell.links?.length ? cell.links : [cell.text];
      for (const raw of names) {
        const name = cleanName(raw);
        if (plausible(name)) map.set(strip(name), team);
      }
    }
  }
  return map;
}

async function titlesFromChampions(log) {
  const html = await getFullPageHtml("List of NASCAR Cup Series champions");
  // Use ONLY the chronological champions table (largest with Season + Driver)
  // so titles aren't double-counted against the by-count summary table.
  let best = null;
  for (const t of parseTables(html)) {
    const header = t.find((r) => r.some((c) => c.header));
    if (!header) continue;
    const cols = header.map((c) => c.text.toLowerCase());
    const yi = cols.findIndex((c) => c.includes("season") || c.includes("year"));
    const di = cols.findIndex((c) => c.includes("driver"));
    if (yi === -1 || di === -1) continue;
    if (!best || t.length > best.rows.length) best = { rows: t, yi, di };
  }
  // Count DISTINCT champion years per driver — rowspanned cells in the old
  // rows otherwise duplicate a (driver, year) pair many times (Joe Weatherly's
  // 1963 appears 9×, Pearson's 1968 twice, …).
  const years = new Map();
  if (best) {
    for (const r of best.rows) {
      const y = parseInt(r[best.yi]?.text, 10);
      const name = r[best.di]?.links?.[0] || r[best.di]?.text;
      if (!Number.isFinite(y) || y < 1949 || y > 2100 || !name) continue;
      const k = strip(cleanName(name));
      if (!years.has(k)) years.set(k, new Set());
      years.get(k).add(y);
    }
  }
  const titles = new Map([...years].map(([k, ys]) => [k, ys.size]));
  log(`NASCAR: parsed ${[...titles.values()].reduce((a, b) => a + b, 0)} champion seasons (${titles.size} champions)`);
  return titles;
}

/* Independent check on career wins: Wikipedia's "List of all-time NASCAR Cup
   Series winners" — one row per Cup race winner with a combined total that
   counts Cup points races only (Strictly Stock/Grand National 1949–1970,
   Winston Cup 1971–2003, 2004–present). No Xfinity/Busch, Truck, ARCA, Duel
   or Clash wins. Drivers absent from it have 0 Cup wins.
   Returns name -> wins. Names must match exactly; LIST_ALIASES covers the
   few drivers the list names differently (never guess Jr./Sr. — Bobby
   Hamilton Jr. has 0 Cup wins, his father 4). */
const LIST_ALIASES = { "Johnny Benson": "Johnny Benson Jr." };
async function cupWinsFromList(log) {
  const html = await getFullPageHtml("List of all-time NASCAR Cup Series winners");
  let table = null;
  for (const t of parseTables(html)) {
    const h = t[0].map((c) => c.text.toLowerCase());
    if (h.some((c) => /\bdriver\b/.test(c)) && h.some((c) => c.includes("combined"))) { table = t; break; }
  }
  if (!table) { log("  ! NASCAR: all-time winners list not found — wins can't be cross-checked"); return null; }
  const h = table[0].map((c) => c.text.toLowerCase());
  const di = h.findIndex((c) => /\bdriver\b/.test(c));
  const wi = h.findIndex((c) => c.includes("combined"));
  const wins = new Map();
  for (const r of table.slice(1)) {
    const name = cleanName((r[di]?.links?.[0] || r[di]?.text || "").replace(/[*^#°]/g, "")).trim();
    const w = parseInt(r[wi]?.text, 10);
    if (name && Number.isFinite(w)) wins.set(strip(name), w);
  }
  log(`NASCAR: all-time winners list — ${wins.size} winners, ${[...wins.values()].reduce((a, b) => a + b, 0)} wins`);
  return (name) => wins.get(strip(LIST_ALIASES[name] || name)) || 0;
}

/* Team display text as the page shows it: drop footnote markers ("[ 3 ]",
   "[a]") and trailing disambiguators ("(NASCAR team)"). Display text, not
   the link target — a link to "NASCAR operations of Team Penske" reads
   "Team Penske" on the page. */
const cleanTeam = (s) => (s || "").replace(/\[[^\]]*\]/g, "").replace(/\s*\([^)]*\)\s*$/, "").replace(/\s+/g, " ").trim();

const CUP_HEAD = /cup series|winston cup|grand national series|strictly stock/i;
const NOT_CUP = /busch|nationwide|xfinity|o'reilly|truck|west|east|north|south|late model|modified|baby grand|international|pro series|arca|euro|pinty|canada|mexico|whelen|k&n|all-star/i;
const isCupHeading = (s) => CUP_HEAD.test(s) && !NOT_CUP.test(s);
const isStart = (v) => /^\d/.test(v.trim().replace(/^[A-Za-z]{2,4}\s*/, "")); // "DAY 22" / "22" — not "DAY DNQ", "RCH"

/* From a driver's article, their team in their final Cup season: the Cup
   results table ("Year | Team | No. | Make | 1 … 36 | rank | Pts"), last
   year with a start, the team with the most starts that year (ties -> the
   team that raced later). Null if the article has no Cup results table. */
async function finalSeasonTeam(title) {
  const html = await getFullPageHtml(title);
  if (!html) return null;
  const heads = [...html.matchAll(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ at: m.index, text: m[2].replace(/<[^>]+>/g, "") }));
  const rows = [];
  for (const m of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const t0 = parseTables(m[0])[0];
    if (!t0 || t0.length < 2) continue;
    const hi = t0.slice(0, 3).findIndex((r) => r.some((c) => /^year$/i.test(c.text.trim())));
    if (hi === -1) continue;
    const label = `${heads.filter((x) => x.at < m.index).at(-1)?.text || ""} ${hi > 0 ? t0[0][0].text : ""}`;
    if (!isCupHeading(label)) continue;
    const t = t0.slice(hi), h = t[0].map((c) => c.text.trim());
    const yi = h.findIndex((x) => /^year$/i.test(x)), ti = h.findIndex((x) => /^team$/i.test(x));
    if (ti === -1) continue;
    const from = Math.max(ti, h.findIndex((x) => /^no\.?$/i.test(x)), h.findIndex((x) => /^make$/i.test(x))) + 1;
    const pts = h.findIndex((x, i) => i >= from && /^(pts\.?|points)$/i.test(x));
    const to = pts > 0 ? pts - 1 : h.length - 3; // the rank column sits just before Pts
    for (const r of t.slice(1)) {
      const year = parseInt(r[yi]?.text, 10);
      const team = cleanTeam(r[ti]?.text);
      if (!year || !team) continue;
      let starts = 0, last = -1;
      for (let c = from; c < to; c++) if (r[c] && isStart(r[c].text)) { starts++; last = c; }
      if (starts) rows.push({ year, team, starts, last });
    }
  }
  if (!rows.length) return null;
  const year = Math.max(...rows.map((r) => r.year));
  const byTeam = new Map();
  for (const r of rows.filter((r) => r.year === year)) {
    const b = byTeam.get(r.team) || { team: r.team, starts: 0, last: -1 };
    b.starts += r.starts; b.last = Math.max(b.last, r.last);
    byTeam.set(r.team, b);
  }
  const best = [...byTeam.values()].sort((a, b) => b.starts - a.starts || b.last - a.last)[0];
  return { team: best.team, year };
}

export async function collectNascar(currentYear, log) {
  const titles = await titlesFromChampions(log);
  const listWins = await cupWinsFromList(log);

  const drivers = new Map(); // strip -> { name, seasons:Set, full:Set, wins, lastYear, lastTeam }
  let parsed = 0;
  for (let year = HISTORY_FROM; year <= currentYear; year++) {
    const title = await resolveSeasonTitle(year);
    if (!title) { log(`  ! NASCAR ${year}: no season page`); continue; }
    const tabs = parseTables(await getFullPageHtml(title));
    const st = parseStandings(tabs);
    if (!st) { log(`  ! NASCAR ${year}: no standings table`); continue; }
    const teams = parseTeams(tabs);
    parsed++;

    for (const [key, info] of st.drivers) {
      let d = drivers.get(key);
      if (!d) { d = { name: info.name, title: null, seasons: new Set(), full: new Set(), wins: 0, lastYear: 0, lastTeam: null }; drivers.set(key, d); }
      if (!d.title && info.title) d.title = info.title;
      d.seasons.add(year);
      d.wins += info.wins;
      if (st.races > 0 && info.starts >= FULL_SEASON_FRACTION * st.races) d.full.add(year);
      if (year >= d.lastYear) { d.lastYear = year; const tm = teams.get(key); if (tm) d.lastTeam = tm; }
    }
    log(`  NASCAR ${year}: "${title}" races≈${st.races}, ${st.drivers.size} classified`);
  }
  log(`NASCAR: parsed ${parsed} seasons ${HISTORY_FROM}-${currentYear}`);

  const records = [];
  let fromPage = 0;
  for (const d of drivers.values()) {
    if (![...d.full].some((y) => y >= YEAR_FROM)) continue; // full-time in some year >= 1970
    const debut = Math.min(...d.seasons);
    const lastFull = Math.max(...d.full);
    const page = d.title ? await finalSeasonTeam(d.title) : null;
    if (page) fromPage++;
    const team = page ? page.team : d.lastTeam ? cleanTeam(d.lastTeam) || null : null;
    records.push({
      name: d.name,
      series: "NASCAR Cup",
      team,
      titles: titles.get(strip(d.name)) || 0,
      wins: d.wins,
      _cupWinsList: listWins ? listWins(d.name) : null, // cross-checked in merge-nascar.js
      status: inferStatus(lastFull, null, currentYear),
      debut,
      _complete: Boolean(team && Number.isFinite(debut)),
      _fullSeasons: d.full.size,
      _teamSource: page ? `driver article (${page.year})` : d.lastTeam ? "season entry table" : null,
      _source: "wikipedia (NASCAR standings+teams)",
    });
  }

  log(`NASCAR (${YEAR_FROM}+ full-time): ${records.length} drivers; team from the driver's own article for ${fromPage}.`);
  return records;
}
