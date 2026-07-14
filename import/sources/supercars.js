/* V8 Supercars source per DATA_SOURCES.md §9 — single class (like WRC),
   built from license-clean Wikipedia/Wikidata. Scoped to the clean
   two-tier-entries era (2005+); pre-2005 ATCC legends (Brock, Moffat,
   Johnson, Seton, …) stay hand-curated.

   - roster + full-time + team: "YYYY (V8) Supercars Championship" season
     "Teams and drivers" table. It has a two-tier header ("Championship
     entries" super-header) with a "Driver name" column (the full-season
     driver — NOT the "Endurance entries / Co-driver name" columns), a
     championship "Rounds" column (full-time), and a "Team" column.
   - career wins (race wins): count each season's "Winning driver" column.
   - titles: the Australian Touring Car Championship champions table
     ("Driver | Championships | Years"; count the listed years).
   - nationality: Wikidata (mostly AUS/NZ).

   debut = first full-time season; merge overrides with the curated real
   debut. wins use MAX(counted, curated) at merge — counted misses
   pre-2005 wins, curated goes stale for active drivers. */

import { resolveTitle, getSections, getSectionHtml, getFullPageHtml, parseTables } from "../lib/wikipedia.js";
import { findDriver, driverFacts, occupationIsDriver } from "../lib/wikidata.js";
import { toCountry, continentOf, inferStatus } from "../lib/normalize.js";
import { FULL_SEASON_FRACTION } from "../config.js";

const ACC_FROM = 2005; // clean two-tier "Teams and drivers" era (1999 uses a different structure)
const ROSTER_FROM = 2005;

/* Supercars is overwhelmingly Australian; Wikidata resolves the non-AU
   regulars (NZ/etc.), and its misses default to Australia — except the
   few non-AU drivers Wikidata's search fails to resolve. */
const NATIONALITY_OVERRIDE = {
  "Matt Payne": "New Zealand",
};
const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();
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

/* Combine the leading run of header rows into one header per column
   (Supercars entries use a two-tier "Championship entries" super-header). */
function combinedHeader(t) {
  const hrs = [];
  for (const r of t) { if (r.filter((c) => c.header).length >= r.length / 2) hrs.push(r); else break; }
  if (!hrs.length) hrs.push(t[0]);
  const width = Math.max(...t.map((r) => r.length));
  const comb = [];
  for (let i = 0; i < width; i++) comb[i] = hrs.map((r) => (r[i] ? r[i].text.toLowerCase() : "")).join(" ").trim();
  return { comb, dataFrom: t.indexOf(hrs[hrs.length - 1]) + 1 };
}

async function seasonPage(year) {
  return resolveTitle([
    `${year} Supercars Championship`, `${year} V8 Supercars Championship`,
    `${year} International V8 Supercars Championship`, `${year} V8 Supercar Championship Series`,
    `${year} V8 Supercar season`,
  ]);
}

async function titlesMap(log) {
  const tabs = parseTables(await getFullPageHtml("Australian Touring Car Championship"));
  let best = null;
  for (const t of tabs) {
    const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
    const cols = hdr.map((c) => c.text.toLowerCase());
    const di = cols.findIndex((c) => c.includes("driver"));
    const yi = cols.findIndex((c) => c.includes("year"));
    if (di !== -1 && yi !== -1 && t.length > (best?.rows.length || 0)) best = { rows: t, di, yi };
  }
  const titles = new Map();
  if (best) {
    for (const r of best.rows) {
      const name = r[best.di]?.links?.[0] || r[best.di]?.text;
      if (!name) continue;
      const years = ((r[best.yi]?.text) || "").match(/\b(?:19|20)\d\d\b/g);
      if (years && years.length) titles.set(strip(cleanName(name)), years.length);
    }
  }
  log(`Supercars: parsed titles for ${titles.size} champions`);
  return titles;
}

async function winsMap(log) {
  const wins = new Map();
  for (let year = ACC_FROM; year <= new Date().getUTCFullYear(); year++) {
    const title = await seasonPage(year);
    if (!title) continue;
    for (const t of parseTables(await getFullPageHtml(title))) {
      const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
      const wi = hdr.map((c) => c.text.toLowerCase()).findIndex((c) => /winning driver/.test(c) || c === "winner");
      if (wi === -1) continue;
      for (const r of t) {
        if (r === hdr) continue;
        const name = r[wi]?.links?.[0] || r[wi]?.text;
        if (name && plausible(cleanName(name))) {
          const k = strip(cleanName(name));
          wins.set(k, (wins.get(k) || 0) + 1);
        }
      }
      break;
    }
  }
  log(`Supercars: counted race wins for ${wins.size} drivers (${ACC_FROM}+)`);
  return wins;
}

export async function collectSupercars(currentYear, log) {
  const titles = await titlesMap(log);
  const wins = await winsMap(log);

  const drivers = new Map();
  for (let year = ROSTER_FROM; year <= currentYear; year++) {
    const title = await seasonPage(year);
    if (!title) continue;
    const secs = await getSections(title);
    const sec = secs.find((s) => /teams and drivers|^entries|entry list|drivers and teams/i.test(s.line));
    const html = sec ? await getSectionHtml(title, sec.index) : await getFullPageHtml(title);

    let et = null, di = -1, ri = -1, ti = -1, dataFrom = 1;
    for (const t of parseTables(html)) {
      const { comb, dataFrom: df } = combinedHeader(t);
      const d = comb.findIndex((h) => h.includes("driver") && !/co.?driver/.test(h) && !/endurance/.test(h));
      const rd = comb.findIndex((h) => /round/.test(h) && !/endurance/.test(h));
      if (d !== -1 && rd !== -1) {
        et = t; di = d; ri = rd; dataFrom = df;
        ti = comb.findIndex((h) => /team/.test(h) && !/endurance/.test(h));
        break;
      }
    }
    if (!et) { log(`  ! Supercars ${year}: no Driver+Rounds table`); continue; }

    let seasonRounds = 0;
    for (let i = dataFrom; i < et.length; i++) seasonRounds = Math.max(seasonRounds, maxRoundNum(et[i][ri]?.text));
    seasonRounds = seasonRounds || 13;

    for (let i = dataFrom; i < et.length; i++) {
      const row = et[i];
      const cell = row[di];
      if (!cell || cell.header) continue;
      const rc = roundsCount(row[ri]?.text);
      if (rc < FULL_SEASON_FRACTION * seasonRounds) continue;
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
    log(`  Supercars ${year}: "${title}" rounds≈${seasonRounds}`);
  }

  const records = [];
  let i = 0;
  for (const d of drivers.values()) {
    i++;
    if (i % 20 === 0) log(`Supercars: enriched ${i}/${drivers.size}`);
    const key = strip(d.name);

    let country = null;
    const hit = await findDriver(d.name);
    if (hit) {
      const facts = await driverFacts(hit.qid);
      if (occupationIsDriver(facts.occupations) !== false) country = toCountry(facts.citizenship);
    }
    if (!country) country = NATIONALITY_OVERRIDE[d.name] || "Australia";

    records.push({
      name: d.name,
      country,
      continent: country ? continentOf(country) : null,
      series: "V8 Supercars",
      team: d.lastTeam ? d.lastTeam.trim() : null,
      titles: titles.get(key) || 0,
      wins: wins.get(key) || 0,
      status: inferStatus(d.lastYear, null, currentYear),
      debut: Math.min(...d.full),
      _complete: Boolean(country && continentOf(country) && d.lastTeam),
      _fullSeasons: d.full.size,
      _source: "wikipedia+wikidata (V8 Supercars)",
    });
  }

  log(`Supercars (${ROSTER_FROM}+): ${records.length} full-time drivers.`);
  return records;
}
