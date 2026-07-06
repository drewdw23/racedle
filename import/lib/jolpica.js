/* Jolpica-F1 client — the community-run successor to the Ergast API
   (Ergast was retired end of 2024). Same response shape as Ergast.
   Open data, structured JSON, F1 1950–present. Docs:
   https://github.com/jolpica/jolpica-f1

   This gives us the whole F1 roster with clean nationality, per-season
   championship positions (-> titles), career wins, and debut year, so
   F1 needs no Wikipedia scraping. */

import { getJSON } from "./http.js";

const BASE = "https://api.jolpi.ca/ergast/f1";

/* Ergast paginates at 30 by default; request the max and page through. */
async function paged(path, listSelector) {
  const LIMIT = 100;
  let offset = 0;
  const all = [];
  for (;;) {
    const data = await getJSON(`${BASE}/${path}.json?limit=${LIMIT}&offset=${offset}`);
    if (!data || data.__httpError) break;
    const table = data.MRData;
    const list = listSelector(table);
    all.push(...list);
    const total = Number(table.total);
    offset += LIMIT;
    if (offset >= total) break;
  }
  return all;
}

/* All drivers who started at least one race in [from, to]. Returns a
   Map keyed by Ergast driverId. */
export async function seasonDrivers(from, to) {
  const drivers = new Map();
  for (let year = from; year <= to; year++) {
    const list = await paged(`${year}/drivers`, (t) => t.DriverTable.Drivers);
    for (const d of list) {
      if (!drivers.has(d.driverId)) {
        drivers.set(d.driverId, {
          driverId: d.driverId,
          name: `${d.givenName} ${d.familyName}`,
          nationality: d.nationality, // Ergast uses demonyms, e.g. "British"
          seasons: new Set(),
        });
      }
      drivers.get(d.driverId).seasons.add(year);
    }
  }
  return drivers;
}

/* Championship titles = count of seasons finished 1st in the drivers'
   standings. */
export async function titlesByDriver(from, to) {
  const titles = new Map();
  for (let year = from; year <= to; year++) {
    const data = await getJSON(`${BASE}/${year}/driverStandings/1.json`);
    if (!data || data.__httpError) continue;
    const lists = data.MRData.StandingsTable.StandingsLists;
    if (!lists?.length) continue;
    const champ = lists[0].DriverStandings?.[0];
    if (champ) titles.set(champ.Driver.driverId, (titles.get(champ.Driver.driverId) || 0) + 1);
  }
  return titles;
}

/* Career race wins per driver (all-time, not just in-range), taken
   from finishing position 1. */
export async function winsByDriver(driverId) {
  const data = await getJSON(`${BASE}/drivers/${driverId}/results/1.json?limit=1`);
  if (!data || data.__httpError) return 0;
  return Number(data.MRData.total || 0);
}

/* Debut season + latest season, for status inference. */
export async function careerSpan(driverId) {
  const seasons = await paged(`drivers/${driverId}/seasons`, (t) => t.SeasonTable.Seasons);
  if (!seasons.length) return { debut: null, last: null };
  const years = seasons.map((s) => Number(s.season)).sort((a, b) => a - b);
  return { debut: years[0], last: years[years.length - 1] };
}
