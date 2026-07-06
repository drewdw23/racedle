/* F1 source — fully structured via Jolpica/Ergast, no scraping and no
   per-driver calls. A single pass over season driver-standings yields
   complete records (name, country, titles, wins, debut, status, last
   team) in ~77 requests total, well under Jolpica's hourly limit. */

import { seasonStandings } from "../lib/jolpica.js";
import { toCountry, inferStatus, buildRecord } from "../lib/normalize.js";
import { YEAR_FROM, YEAR_TO } from "../config.js";

export async function collectF1(currentYear, log) {
  log("F1: scanning season standings via Jolpica (bulk; ~1 request per season)…");
  // Accumulate career totals from 1950 for accuracy; keep drivers active
  // from YEAR_FROM (1970) onward, matching the project scope.
  const drivers = await seasonStandings(1950, YEAR_FROM, YEAR_TO, currentYear, log);

  const records = [];
  for (const d of drivers.values()) {
    records.push(
      buildRecord({
        name: d.name,
        country: toCountry(d.nationality),
        series: "Formula 1",
        team: d.lastTeam,
        titles: d.titles,
        wins: d.wins,
        status: inferStatus(d.lastSeason, null, currentYear),
        debut: d.debut,
      })
    );
  }
  log(`F1: ${records.length} drivers active ${YEAR_FROM}+ (career totals computed from 1950).`);
  return records;
}
