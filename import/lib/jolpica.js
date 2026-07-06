/* Jolpica-F1 client — the community-run successor to the Ergast API
   (Ergast was retired end of 2024). Same response shape as Ergast.
   Docs: https://github.com/jolpica/jolpica-f1

   RATE LIMITS: unauthenticated use is throttled to ~500 requests/hour
   (and ~4/sec burst), with NO Retry-After header. So we must keep the
   request count tiny: instead of 3+ calls per driver, we make a single
   pass over end-of-season DRIVER STANDINGS (one call per season, ~77
   total for 1950–present). Each standing row already carries the
   driver's nationality, that season's win count, championship position,
   and constructor(s) — everything we need. */

import { getJSON, isHttpError } from "./http.js";

const BASE = "https://api.jolpi.ca/ergast/f1";

/* Fetch (and page through) one season's final driver standings.
   Returns an array of standing rows, or null if the fetch failed
   (rate-limited/error) so the caller can note the gap and move on. */
async function standingsForSeason(year) {
  const LIMIT = 100;
  let offset = 0;
  const rows = [];
  for (;;) {
    const data = await getJSON(`${BASE}/${year}/driverStandings.json?limit=${LIMIT}&offset=${offset}`);
    if (!data || isHttpError(data)) return null;
    const list = data.MRData.StandingsTable.StandingsLists[0];
    if (!list) return rows; // season had no championship standings
    rows.push(...list.DriverStandings);
    const total = Number(data.MRData.total);
    offset += LIMIT;
    if (offset >= total) break;
  }
  return rows;
}

/* Pure accumulator (unit-testable, no network): fold one season's
   standing rows into the per-driver map.
   - wins: summed across seasons -> career wins
   - titles: seasons finished 1st, but NOT the current (incomplete)
     calendar year, whose leader isn't champion yet
   - lastSeason/lastTeam: from the most recent season seen
   - seasons: for debut (min) and "active in range" filtering */
export function accumulateSeason(drivers, year, standings, currentYear) {
  for (const s of standings) {
    const id = s.Driver.driverId;
    if (!drivers.has(id)) {
      drivers.set(id, {
        driverId: id,
        name: `${s.Driver.givenName} ${s.Driver.familyName}`,
        nationality: s.Driver.nationality,
        seasons: new Set(),
        wins: 0,
        titles: 0,
        lastSeason: 0,
        lastTeam: null,
      });
    }
    const d = drivers.get(id);
    d.seasons.add(year);
    d.wins += Number(s.wins || 0);
    if (Number(s.position) === 1 && year < currentYear) d.titles += 1;
    if (year >= d.lastSeason) {
      d.lastSeason = year;
      const cons = s.Constructors;
      if (cons && cons.length) d.lastTeam = cons[cons.length - 1].name;
    }
  }
  return drivers;
}

/* One pass over seasons. Accumulates true career totals from `accFrom`
   (so wins/titles/debut are correct even for pre-1970 debutants) but
   keeps only drivers who appear in a season >= `keepFrom`. */
export async function seasonStandings(accFrom, keepFrom, to, currentYear, log) {
  const drivers = new Map();
  let failed = 0;
  for (let year = accFrom; year <= to; year++) {
    const rows = await standingsForSeason(year);
    if (rows === null) {
      failed++;
      continue;
    }
    accumulateSeason(drivers, year, rows, currentYear);
    if (log && year % 10 === 0) log(`  F1: standings scanned through ${year} (${drivers.size} drivers so far)`);
  }
  if (failed && log) {
    log(`  ! F1: ${failed} season(s) failed to fetch (likely rate-limited). Rerun later — cached seasons are reused, so it resumes.`);
  }

  const out = new Map();
  for (const [id, d] of drivers) {
    if ([...d.seasons].some((y) => y >= keepFrom)) {
      d.debut = Math.min(...d.seasons);
      out.set(id, d);
    }
  }
  return out;
}
