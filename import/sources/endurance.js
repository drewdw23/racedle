/* Shared endurance source (WEC + IMSA) per DATA_SOURCES.md §7/§10.

   Both are multi-class series with the same shape:
   - roster + full-time + team: each season page's "Entries" section has
     one table per class; take the TOP-CLASS table (Hypercar/LMP1 for WEC;
     GTP/DPi/Prototype for IMSA — always listed first) and keep drivers
     who ran >= FULL_SEASON_FRACTION of the season's rounds (the Rounds
     column). Cars carry 2-3 drivers per cell.
   - titles: each season's TOP-CLASS drivers' "Standings"/"Championship"
     section — the P1 crew (2-3 co-champions share the title).
   - nationality: Wikidata.

   ⚠️ WINS ARE A GAP (documented): endurance season results list the
   winning TEAM per class per round, not the driver, and multi-car teams
   are ambiguous. So wins are emitted as 0; merge-endurance.js takes
   MAX(0, curated) so the notable winners already hand-curated keep their
   wins, and new drivers show 0. A future pass could map winning car ->
   its full-season drivers.

   cfg = { series, from, titleFn(year)->[candidate titles], standingsRe: RegExp } */

import { resolveTitle, getSections, getSectionHtml, getFullPageHtml, parseTables } from "../lib/wikipedia.js";
import { findDriver, driverFacts, occupationIsDriver } from "../lib/wikidata.js";
import { toCountry, continentOf, inferStatus } from "../lib/normalize.js";
import { FULL_SEASON_FRACTION } from "../config.js";

const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();

/* Endurance is international, so there's no national default (unlike NASCAR/
   Supercars). These are drivers Wikidata's name search fails to resolve. */
const NATIONALITY_OVERRIDE = {
  "Matt Campbell": "Australia", "Nico Prost": "France", "Yifei Ye": "China",
  "Ed Brown": "United States", "Eric Curran": "United States", "Joel Miller": "United States",
  "Katherine Legge": "United Kingdom", "Laurin Heinrich": "Germany", "Tom Long": "United States",
};
const cleanName = (s) => s.replace(/\s*\([^)]*\)\s*$/, "").trim();
const plausible = (s) => /^[\p{L}][\p{L}\p{M}.'-]*(?:\s+[\p{L}][\p{L}\p{M}.'-]*)+$/u.test(s);

function roundsCount(text) {
  const t = (text || "").trim();
  if (/^all$/i.test(t)) return Infinity;
  let n = 0;
  for (const part of t.split(/[,;]/)) {
    const m = part.trim().match(/^(\d+)\s*[–\-]\s*(\d+)$/);
    if (m) n += Number(m[2]) - Number(m[1]) + 1;
    else if (/^\d+$/.test(part.trim())) n += 1;
  }
  return n;
}
function maxRoundNum(text) {
  let mx = 0;
  for (const part of (text || "").split(/[,;]/)) {
    const m = part.trim().match(/^(\d+)\s*[–\-]\s*(\d+)$/);
    if (m) mx = Math.max(mx, Number(m[2]));
    else if (/^\d+$/.test(part.trim())) mx = Math.max(mx, Number(part.trim()));
  }
  return mx;
}

/* First table that has a Driver column and a Rounds column. */
function driverRoundsTable(tables) {
  for (const t of tables) {
    const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
    const cols = hdr.map((c) => c.text.toLowerCase());
    const di = cols.findIndex((c) => c.includes("driver"));
    const ri = cols.findIndex((c) => /round/.test(c));
    if (di !== -1 && ri !== -1) {
      let ti = cols.findIndex((c) => c === "team" || c.includes("team"));
      if (ti === -1) ti = cols.findIndex((c) => c.includes("entrant"));
      return { t, hdr, di, ri, ti };
    }
  }
  return null;
}

export async function collectEndurance(currentYear, log, cfg) {
  const drivers = new Map(); // strip -> { name, full:Set, lastYear, lastTeam }
  const seenTitles = new Set(); // WEC superseasons resolve to one page from two iteration years

  // Titles from the hardcoded top-class champions map (completed seasons only).
  const titles = new Map(); // strip -> count
  for (const [yr, names] of Object.entries(cfg.champions || {})) {
    if (Number(yr) >= currentYear) continue;
    for (const n of names) titles.set(strip(n), (titles.get(strip(n)) || 0) + 1);
  }

  for (let year = cfg.from; year <= currentYear; year++) {
    const title = await resolveTitle(cfg.titleFn(year));
    if (!title || seenTitles.has(title)) continue;
    seenTitles.add(title);
    const secs = await getSections(title);

    // ---- top-class entries (roster / full-time / team) ----
    // Classes are listed top-first, so the FIRST Driver+Rounds table in the
    // Entries section is the top class (Hypercar/LMP1 for WEC; GTP/DPi/
    // Prototype for IMSA).
    const es = secs.find((s) => /^entries$|entry list/i.test(s.line));
    const entriesHtml = es ? await getSectionHtml(title, es.index) : await getFullPageHtml(title);
    const found = driverRoundsTable(parseTables(entriesHtml));
    if (found) {
      const { t, hdr, di, ri, ti } = found;
      let seasonRounds = 0;
      for (const row of t) if (row !== hdr) seasonRounds = Math.max(seasonRounds, maxRoundNum(row[ri]?.text));
      seasonRounds = seasonRounds || 8;
      for (const row of t) {
        if (row === hdr) continue;
        const cell = row[di];
        if (!cell) continue;
        if (roundsCount(row[ri]?.text) < FULL_SEASON_FRACTION * seasonRounds) continue;
        const names = cell.links?.length ? cell.links : [cell.text];
        for (const raw of names) {
          const name = cleanName(raw);
          if (!plausible(name)) continue;
          const k = strip(name);
          if (!drivers.has(k)) drivers.set(k, { name, full: new Set(), lastYear: 0, lastTeam: null });
          const d = drivers.get(k);
          d.full.add(year);
          if (year >= d.lastYear) {
            d.lastYear = year;
            if (ti !== -1) d.lastTeam = row[ti]?.links?.[0] || row[ti]?.text || d.lastTeam;
          }
        }
      }
    } else {
      log(`  ! ${cfg.series} ${year}: no top-class entries table`);
    }
    // (titles come from the hardcoded cfg.champions map computed above)
    log(`  ${cfg.series} ${year}: "${title}"`);
  }

  // ---- enrich (nationality via Wikidata) ----
  const records = [];
  let i = 0;
  for (const d of drivers.values()) {
    i++;
    if (i % 20 === 0) log(`${cfg.series}: enriched ${i}/${drivers.size}`);
    const k = strip(d.name);
    let country = NATIONALITY_OVERRIDE[d.name] || null;
    if (!country) {
      const hit = await findDriver(d.name);
      if (hit) {
        const facts = await driverFacts(hit.qid);
        if (occupationIsDriver(facts.occupations) !== false) country = toCountry(facts.citizenship);
      }
    }
    records.push({
      name: d.name,
      country,
      continent: country ? continentOf(country) : null,
      series: cfg.series,
      team: d.lastTeam ? d.lastTeam.trim() : null,
      titles: titles.get(k) || 0,
      wins: 0, // GAP — see header; merge takes MAX(0, curated)
      status: inferStatus(d.lastYear, null, currentYear),
      debut: Math.min(...d.full),
      _complete: Boolean(country && continentOf(country) && d.lastTeam),
      _fullSeasons: d.full.size,
      _source: `wikipedia+wikidata (${cfg.series})`,
    });
  }

  log(`${cfg.series} (${cfg.from}+): ${records.length} full-time top-class drivers (wins=0, gap).`);
  return records;
}
