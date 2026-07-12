/* WRC source per DATA_SOURCES.md §8 — the cleanest Wikipedia-based
   series (single class, explicit Driver vs Co-driver columns, clean
   titles, one winning driver per rally).

   All license-clean (Wikipedia CC BY-SA + Wikidata CC0):
   - roster + full-time + team: "YYYY World Rally Championship" season
     "Teams and drivers" table — Driver column (NOT Co-driver), Rounds
     column (>= FULL_SEASON_FRACTION of the season = full-time), and the
     Team/Entrant/Manufacturer column. Clean back to ~1990.
   - career wins: count the "Winning driver" column of each season's
     results table (exactly one winning driver per rally — unambiguous,
     unlike endurance). Accumulated from 1973 so career totals are right
     even for drivers whose wins predate the roster window.
   - titles: the main WRC article's champions table (P1 driver/season).
   - nationality: Wikidata.

   Pre-1990 legends (Röhrl, Mikkola, Mouton, …) stay hand-curated — like
   the CART/pre-2012 tails. debut = first full-time season; merge-wrc.js
   overrides with the curated real debut where the driver already exists. */

import { resolveTitle, getSections, getSectionHtml, getFullPageHtml, parseTables } from "../lib/wikipedia.js";
import { findDriver, driverFacts, occupationIsDriver } from "../lib/wikidata.js";
import { toCountry, continentOf, inferStatus } from "../lib/normalize.js";
import { FULL_SEASON_FRACTION } from "../config.js";

const ACC_FROM = 1973; // WRC start — accumulate wins/titles from here (all-time career totals)
const ROSTER_FROM = 2014; // clean single-tier "Teams and drivers" era; 2003–2013 uses two-tier
                          // "Manufacturers" super-headers + J-WRC/P-WRC support tables that
                          // mis-parse, so pre-2014 legends (Loeb, Grönholm, McRae, …) stay in
                          // the hand-curated tail — same pattern as the CART/pre-2012 tails.
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

async function seasonPage(year) {
  const title = await resolveTitle([`${year} World Rally Championship season`, `${year} World Rally Championship`]);
  return title;
}

async function titlesMap(log) {
  const tabs = parseTables(await getFullPageHtml("World Rally Championship"));
  let best = null;
  for (const t of tabs) {
    const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
    const cols = hdr.map((c) => c.text.toLowerCase());
    const yi = cols.findIndex((c) => c.includes("season") || c.includes("year"));
    const di = cols.findIndex((c) => c.includes("driver") || c.includes("champion"));
    if (yi !== -1 && di !== -1 && t.length > (best?.rows.length || 0)) best = { rows: t, yi, di };
  }
  const titles = new Map();
  if (best) {
    for (const r of best.rows) {
      const y = parseInt(r[best.yi]?.text, 10);
      const name = r[best.di]?.links?.[0] || r[best.di]?.text;
      if (!Number.isFinite(y) || y < 1973 || !name) continue;
      const k = strip(cleanName(name));
      titles.set(k, (titles.get(k) || 0) + 1);
    }
  }
  log(`WRC: parsed ${[...titles.values()].reduce((a, b) => a + b, 0)} champion-seasons`);
  return titles;
}

/* Count each season's per-rally winning drivers. */
async function winsMap(log) {
  const wins = new Map();
  for (let year = ACC_FROM; year <= new Date().getUTCFullYear(); year++) {
    const title = await seasonPage(year);
    if (!title) continue;
    const tabs = parseTables(await getFullPageHtml(title));
    for (const t of tabs) {
      const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
      // Modern pages label it "Winning driver"; older ones "Overall winners"
      // (driver is the first link in the cell, co-driver second).
      const wi = hdr.map((c) => c.text.toLowerCase()).findIndex((c) => /winning driver|overall winner/.test(c) || c === "winner" || c === "winners");
      if (wi === -1) continue;
      for (const r of t) {
        if (r === hdr) continue;
        const name = r[wi]?.links?.[0] || r[wi]?.text;
        if (name && plausible(cleanName(name))) {
          const k = strip(cleanName(name));
          wins.set(k, (wins.get(k) || 0) + 1);
        }
      }
      break; // first winner table per page
    }
  }
  log(`WRC: counted rally wins for ${wins.size} drivers (${ACC_FROM}+)`);
  return wins;
}

export async function collectWRC(currentYear, log) {
  const titles = await titlesMap(log);
  const wins = await winsMap(log);

  const drivers = new Map(); // strip -> { name, full:Set, lastYear, lastTeam }
  for (let year = ROSTER_FROM; year <= currentYear; year++) {
    const title = await seasonPage(year);
    if (!title) continue;
    const secs = await getSections(title);
    const sec = secs.find((s) => /^entries$|entrants|teams and drivers|crews/i.test(s.line));
    const html = sec ? await getSectionHtml(title, sec.index) : await getFullPageHtml(title);
    const tables = parseTables(html);

    let et = null, di = -1, ri = -1, ti = -1;
    for (const t of tables) {
      const hdr = t.find((r) => r.some((c) => c.header)) || t[0];
      const cols = hdr.map((c) => c.text.toLowerCase());
      const d = cols.findIndex((c) => c.includes("driver") && !c.includes("co")); // Driver, not Co-driver
      const rd = cols.findIndex((c) => /round/.test(c));
      if (d !== -1 && rd !== -1) {
        et = t; di = d; ri = rd;
        ti = cols.findIndex((c) => c === "team");
        if (ti === -1) ti = cols.findIndex((c) => c.includes("entrant"));
        if (ti === -1) ti = cols.findIndex((c) => c.includes("manufacturer"));
        break;
      }
    }
    if (!et) { log(`  ! WRC ${year}: no Driver+Rounds table`); continue; }

    const hdrRow = et.find((r) => r.some((c) => c.header)) || et[0];
    let seasonRounds = 0;
    for (const row of et) if (row !== hdrRow) seasonRounds = Math.max(seasonRounds, maxRoundNum(row[ri]?.text));
    seasonRounds = seasonRounds || 13;

    for (const row of et) {
      if (row === hdrRow) continue;
      const cell = row[di];
      if (!cell) continue;
      const rc = roundsCount(row[ri]?.text);
      if (rc < FULL_SEASON_FRACTION * seasonRounds) continue; // Infinity ("All") passes
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
    log(`  WRC ${year}: "${title}" rounds≈${seasonRounds}`);
  }

  const records = [];
  let i = 0;
  for (const d of drivers.values()) {
    i++;
    if (i % 20 === 0) log(`WRC: enriched ${i}/${drivers.size}`);
    const key = strip(d.name);

    let country = null;
    const hit = await findDriver(d.name);
    if (hit) {
      const facts = await driverFacts(hit.qid);
      if (occupationIsDriver(facts.occupations) !== false) country = toCountry(facts.citizenship);
    }

    records.push({
      name: d.name,
      country,
      continent: country ? continentOf(country) : null,
      series: "WRC",
      team: d.lastTeam ? d.lastTeam.trim() : null,
      titles: titles.get(key) || 0,
      wins: wins.get(key) || 0,
      status: inferStatus(d.lastYear, null, currentYear),
      debut: Math.min(...d.full),
      _complete: Boolean(country && continentOf(country) && d.lastTeam),
      _fullSeasons: d.full.size,
      _source: "wikipedia+wikidata (WRC)",
    });
  }

  log(`WRC (${ROSTER_FROM}+): ${records.length} full-time drivers.`);
  return records;
}
