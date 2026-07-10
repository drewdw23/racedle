/* Modern IndyCar source (2008+ unified series) per DATA_SOURCES.md §6.
   The pre-1979 USAC legends and the CART/Champ Car series stay
   hand-curated — this only covers the modern unified IndyCar Series.

   Assembled from three license-clean Wikipedia/Wikidata sources:
   - roster + full-time + last team: "YYYY IndyCar Series" season pages'
     "Confirmed entries" table, whose Round(s) column lets us keep only
     full-time drivers (>= FULL_SEASON_FRACTION of the season's rounds)
     and drop the many Indy-500-only one-offs.
   - career wins + a debut-era hint: "List of American Championship Car
     winners" (per-driver Combined Total; drivers absent = 0 wins).
   - titles: the champions list, IndyCar lineage 1996+ (clean — avoids
     the pre-1979 USAC multi-division conflation documented in §6).
   - nationality: Wikidata.

   debut is the one field Wikipedia/Wikidata can't give cleanly for
   pre-2008 debutants (entries only go back to 2008; Wikidata P2031 is
   empty). The source emits debut = first full-time season seen and sets
   `_debutFromEntries`; merge-indycar.js overrides it with the curated
   debut where the driver already exists. */

import { resolveTitle, getSections, getSectionHtml, getFullPageHtml, parseTables } from "../lib/wikipedia.js";
import { findDriver, driverFacts, occupationIsDriver } from "../lib/wikidata.js";
import { toCountry, continentOf, inferStatus } from "../lib/normalize.js";
import { FULL_SEASON_FRACTION } from "../config.js";

const FROM = 2008; // unified IndyCar Series (post CART/IRL merger)

/* Nationality for drivers Wikidata's name search fails to resolve. */
const NATIONALITY_OVERRIDE = {
  "Katherine Legge": "United Kingdom",
};
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();
const cleanName = (s) => s.replace(/\s*\([^)]*\)\s*$/, "").trim();
const plausible = (s) => /^[\p{L}][\p{L}\p{M}.'-]*(?:\s+[\p{L}][\p{L}\p{M}.'-]*)+$/u.test(s);

/* "All" | "1–17" | "1, 3, 5" | "6" -> number of rounds (Infinity for All). */
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

async function careerWins(log) {
  const tabs = parseTables(await getFullPageHtml("List of American Championship Car winners"));
  // The comprehensive per-driver table: Driver | Nation | …eras… | Combined Total.
  let best = null;
  for (const t of tabs) {
    const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
    const cols = hdr.map((c) => c.text.toLowerCase());
    const di = cols.findIndex((c) => c.includes("driver"));
    const ti = cols.findIndex((c) => c === "total" || c.includes("combined"));
    if (di !== -1 && ti !== -1 && t.length > (best?.rows.length || 0)) best = { rows: t, di, ti };
  }
  const wins = new Map();
  if (best) {
    for (const r of best.rows) {
      const name = r[best.di]?.links?.[0] || r[best.di]?.text;
      const w = parseInt(r[best.ti]?.text, 10);
      if (name && Number.isFinite(w)) wins.set(strip(cleanName(name)), w);
    }
  }
  log(`IndyCar: ${wins.size} drivers with career-win totals`);
  return wins;
}

async function titlesMap(log) {
  const html = await getFullPageHtml("List of American open-wheel racing national champions");
  let best = null;
  for (const t of parseTables(html)) {
    const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
    const cols = hdr.map((c) => c.text.toLowerCase());
    const yi = cols.findIndex((c) => c.includes("year") || c.includes("season"));
    const si = cols.findIndex((c) => c.includes("series") || c.includes("sanction"));
    const di = cols.findIndex((c) => c.includes("driver") || c.includes("champion"));
    if (yi !== -1 && di !== -1 && t.length > (best?.rows.length || 0)) best = { rows: t, yi, si, di };
  }
  const titles = new Map();
  if (best) {
    for (const r of best.rows) {
      const y = parseInt(r[best.yi]?.text, 10);
      const series = (best.si !== -1 && (r[best.si]?.links?.[0] || r[best.si]?.text)) || "";
      const name = r[best.di]?.links?.[0] || r[best.di]?.text;
      // IndyCar lineage, 1996+ only — clean of the pre-1979 USAC multi-division problem.
      if (!Number.isFinite(y) || y < 1996 || !name) continue;
      if (/USAC|AAA/i.test(series)) continue;
      titles.set(strip(cleanName(name)), (titles.get(strip(cleanName(name))) || 0) + 1);
    }
  }
  log(`IndyCar: parsed ${[...titles.values()].reduce((a, b) => a + b, 0)} IndyCar-lineage title-seasons (1996+)`);
  return titles;
}

export async function collectIndyCar(currentYear, log) {
  const winsMap = await careerWins(log);
  const champs = await titlesMap(log);

  // Walk modern season entries, collecting full-time participation.
  const drivers = new Map(); // strip -> { name, full:Set, lastYear, lastTeam }
  for (let year = FROM; year <= currentYear; year++) {
    const title = await resolveTitle([`${year} IndyCar Series`, `${year} IndyCar Series season`]);
    if (!title) continue;
    const secs = await getSections(title);
    const sec = secs.find((s) => /entries|confirmed entries|teams and drivers/i.test(s.line));
    const html = sec ? await getSectionHtml(title, sec.index) : await getFullPageHtml(title);
    const tables = parseTables(html);

    let et = null, di = -1, ri = -1, ti = -1;
    for (const t of tables) {
      const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
      const cols = hdr.map((c) => c.text.toLowerCase());
      const d = cols.findIndex((c) => c.includes("driver"));
      const rd = cols.findIndex((c) => /round/.test(c));
      if (d !== -1 && rd !== -1) { et = t; di = d; ri = rd; ti = cols.findIndex((c) => c.includes("team")); break; }
    }
    if (!et) { log(`  ! IndyCar ${year}: no entries+rounds table (needs config tuning)`); continue; }

    const hdrRow = et.find((r) => r.some((c) => c.header)) || et[0];
    let seasonRounds = 0;
    for (const row of et) if (row !== hdrRow) seasonRounds = Math.max(seasonRounds, maxRoundNum(row[ri]?.text));
    seasonRounds = seasonRounds || 17;

    for (const row of et) {
      if (row === hdrRow) continue;
      const cell = row[di];
      if (!cell) continue;
      const rc = roundsCount(row[ri]?.text);
      const isFull = rc >= FULL_SEASON_FRACTION * seasonRounds; // Infinity ("All") passes
      if (!isFull) continue;
      const names = cell.links?.length ? cell.links : [cell.text];
      for (const raw of names) {
        const name = cleanName(raw);
        if (!plausible(name)) continue;
        const key = strip(name);
        if (!drivers.has(key)) drivers.set(key, { name, full: new Set(), lastYear: 0, lastTeam: null });
        const d = drivers.get(key);
        d.full.add(year);
        if (year >= d.lastYear) {
          d.lastYear = year;
          if (ti !== -1) d.lastTeam = row[ti]?.links?.[0] || row[ti]?.text || d.lastTeam;
        }
      }
    }
    log(`  IndyCar ${year}: "${title}" rounds≈${seasonRounds}`);
  }

  // Enrich each full-time driver.
  const records = [];
  let i = 0;
  for (const d of drivers.values()) {
    i++;
    if (i % 20 === 0) log(`IndyCar: enriched ${i}/${drivers.size}`);
    const key = strip(d.name);

    let country = NATIONALITY_OVERRIDE[d.name] || null;
    if (!country) {
      const hit = await findDriver(d.name);
      if (hit) {
        const facts = await driverFacts(hit.qid);
        if (occupationIsDriver(facts.occupations) !== false) country = toCountry(facts.citizenship);
      }
    }

    const debut = Math.min(...d.full);
    records.push({
      name: d.name,
      country,
      continent: country ? continentOf(country) : null,
      series: "IndyCar",
      team: d.lastTeam ? d.lastTeam.trim() : null,
      titles: champs.get(key) || 0,
      wins: winsMap.has(key) ? winsMap.get(key) : 0,
      status: inferStatus(d.lastYear, null, currentYear),
      debut,
      _complete: Boolean(country && continentOf(country) && d.lastTeam),
      _fullSeasons: d.full.size,
      _debutFromEntries: true, // merge overrides with curated debut where available
      _source: "wikipedia+wikidata (modern IndyCar)",
    });
  }

  log(`IndyCar (modern, ${FROM}+): ${records.length} full-time drivers.`);
  return records;
}
