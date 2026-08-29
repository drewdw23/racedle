/* NASCAR Cup source — license-clean Wikipedia/Wikidata (DATA_SOURCES.md §5).
   Reworked 2026 from the nascaR.data parquet to the same Wikipedia recipe as
   Supercars/IndyCar/WRC, so NASCAR carries no external-data dependency.

   Scope is 1970→now — the project's established floor (pre-1970 seasons are
   out of scope, and Wikipedia's pre-1972 season pages are inconsistent anyway).
   Per season page ("YYYY NASCAR <era-name> Series"):
   - full-time + wins ← the points-STANDINGS table, in either of two layouts:
       · summary (early-70s): a starts count ("Starts"/"St"/"Races") + "Wins".
       · modern grid: one column per race; a started race is a non-empty
         result cell, a win is a finish of "1". races = race-column count.
     Full-time season = Starts >= FULL_SEASON_FRACTION x races (the analog of
     the other series' "Rounds" rule). Wins = sum across 1970+ seasons.
   - team ← the "Teams and drivers" table (Driver->Team), most-recent season.
   - debut ← earliest 1970+ standings appearance.
   - titles ← Wikipedia "List of NASCAR Cup Series champions" (chronological,
     distinct years — the old rows rowspan-duplicate otherwise).
   - nationality ← default United States + a non-US regulars map (NASCAR is
     overwhelmingly American; the exceptions are named and verified per run).

   Pool = drivers with a full-time season in some year >= YEAR_FROM (1970). */

import { resolveTitle, getFullPageHtml, parseTables } from "../lib/wikipedia.js";
import { continentOf, inferStatus } from "../lib/normalize.js";
import { YEAR_FROM, FULL_SEASON_FRACTION } from "../config.js";

const HISTORY_FROM = YEAR_FROM; // 1970 — the project's roster/stat floor; older seasons are out of scope

/* Non-US full-time Cup regulars (default is United States). Keyed by the
   driver's Wikipedia article name; verify against the pool on each run. */
const NATIONALITY = {
  "Shane van Gisbergen": "New Zealand",
  "Marcos Ambrose": "Australia",
  "Daniel Suárez": "Mexico",
  "Daniel Suarez": "Mexico",
  "Juan Pablo Montoya": "Colombia",
  "Jacques Villeneuve": "Canada",
  "Earl Ross": "Canada",
  "Trevor Boys": "Canada",
  "Patrick Carpentier": "Canada",
  "Ron Fellows": "Canada",
  "Max Papis": "Italy",
  "Dario Franchitti": "United Kingdom",
  "Boris Said": "United States",
};

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
   column, returning the first data-row index too. */
function headerCols(t) {
  const hrs = [];
  for (const r of t) { if (r.filter((c) => c.header).length >= r.length / 2) hrs.push(r); else break; }
  if (!hrs.length) hrs.push(t[0]);
  const width = Math.max(...t.map((r) => r.length));
  const cols = [];
  for (let i = 0; i < width; i++) cols[i] = hrs.map((r) => (r[i] ? r[i].text.toLowerCase() : "")).join(" ").trim();
  return { cols, dataFrom: t.indexOf(hrs[hrs.length - 1]) + 1 };
}

const nameFromCell = (cell) => {
  const raw = cell?.links?.length ? cell.links[0] : cell?.text;
  return raw ? cleanName(raw) : null;
};

/* From all tables on a season page, read the points standings: per driver
   { starts, wins } plus the season's race count. Handles both the summary
   layout (Starts/Wins columns) and the modern per-race grid. Returns the
   best (most drivers) parse, or null. */
function parseStandings(tabs) {
  let best = null;
  for (const t of tabs) {
    const { cols, dataFrom } = headerCols(t);
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
        const name = nameFromCell(t[i][di]);
        if (!name || !plausible(name)) continue;
        const starts = parseInt((t[i][si]?.text || "").replace(/[^\d]/g, ""), 10) || 0;
        const wins = wi !== -1 ? parseInt((t[i][wi]?.text || "").replace(/[^\d]/g, ""), 10) || 0 : 0;
        races = Math.max(races, starts);
        out.set(strip(name), { name, starts, wins });
      }
    } else {
      // ---- modern grid: race columns sit between Driver and Points ----
      const pi = cols.findIndex((c, idx) => idx > di && /\bpoints\b|^pts\b|\bpts\.?$/.test(c));
      if (pi === -1 || pi - di - 1 < 5) continue;
      races = pi - di - 1;
      for (let i = dataFrom; i < t.length; i++) {
        const name = nameFromCell(t[i][di]);
        if (!name || !plausible(name)) continue;
        let starts = 0, wins = 0;
        for (let c = di + 1; c < pi; c++) {
          const v = (t[i][c]?.text || "").trim();
          if (!v || /^[–—-]$/.test(v)) continue;
          const m = v.match(/^(\d+)/);
          if (m) { starts++; if (m[1] === "1") wins++; }
          else if (/^(dnf|dns|dnq|wd|w\/d|c|dsq)\b/i.test(v)) starts++;
        }
        if (starts === 0) continue;
        out.set(strip(name), { name, starts, wins });
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
      const team = (t[i][ti]?.links?.[0] || t[i][ti]?.text || "").trim();
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

export async function collectNascar(currentYear, log) {
  const titles = await titlesFromChampions(log);

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
      if (!d) { d = { name: info.name, seasons: new Set(), full: new Set(), wins: 0, lastYear: 0, lastTeam: null }; drivers.set(key, d); }
      d.seasons.add(year);
      d.wins += info.wins;
      if (st.races > 0 && info.starts >= FULL_SEASON_FRACTION * st.races) d.full.add(year);
      if (year >= d.lastYear) { d.lastYear = year; const tm = teams.get(key); if (tm) d.lastTeam = tm; }
    }
    log(`  NASCAR ${year}: "${title}" races≈${st.races}, ${st.drivers.size} classified`);
  }
  log(`NASCAR: parsed ${parsed} seasons ${HISTORY_FROM}-${currentYear}`);

  const records = [];
  for (const d of drivers.values()) {
    if (![...d.full].some((y) => y >= YEAR_FROM)) continue; // full-time in some year >= 1970
    const country = NATIONALITY[d.name] || "United States";
    const debut = Math.min(...d.seasons);
    const lastFull = Math.max(...d.full);
    const team = d.lastTeam ? d.lastTeam.trim() : null;
    records.push({
      name: d.name,
      country,
      continent: continentOf(country),
      series: "NASCAR Cup",
      team,
      titles: titles.get(strip(d.name)) || 0,
      wins: d.wins,
      status: inferStatus(lastFull, null, currentYear),
      debut,
      _complete: Boolean(country && continentOf(country) && team && Number.isFinite(debut)),
      _fullSeasons: d.full.size,
      _source: "wikipedia (NASCAR standings+teams)",
    });
  }

  log(`NASCAR (${YEAR_FROM}+ full-time): ${records.length} drivers.`);
  return records;
}
