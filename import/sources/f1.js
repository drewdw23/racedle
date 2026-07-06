/* F1 source — fully structured via Jolpica/Ergast, no scraping.
   Produces near-complete records (name, country, titles, wins, debut,
   status, and last team). */

import { getJSON } from "../lib/http.js";
import { seasonDrivers, titlesByDriver, winsByDriver, careerSpan } from "../lib/jolpica.js";
import { toCountry, inferStatus, buildRecord } from "../lib/normalize.js";
import { YEAR_FROM, YEAR_TO } from "../config.js";

const BASE = "https://api.jolpi.ca/ergast/f1";

async function lastTeam(driverId, lastSeason) {
  if (!lastSeason) return null;
  const data = await getJSON(`${BASE}/${lastSeason}/drivers/${driverId}/constructors.json`);
  if (!data || data.__httpError) return null;
  const cons = data.MRData.ConstructorTable.Constructors;
  return cons.length ? cons[cons.length - 1].name : null;
}

export async function collectF1(currentYear, log) {
  log("F1: fetching season rosters via Jolpica…");
  const drivers = await seasonDrivers(YEAR_FROM, YEAR_TO);
  const titles = await titlesByDriver(1950, YEAR_TO); // all-time titles, not just in-range

  const records = [];
  let i = 0;
  for (const d of drivers.values()) {
    i++;
    if (i % 25 === 0) log(`F1: enriched ${i}/${drivers.size}`);
    const span = await careerSpan(d.driverId);
    const wins = await winsByDriver(d.driverId);
    const team = await lastTeam(d.driverId, span.last);
    const status = inferStatus(span.last, null, currentYear);
    records.push(
      buildRecord({
        name: d.name,
        country: toCountry(d.nationality),
        series: "Formula 1",
        team,
        titles: titles.get(d.driverId) || 0,
        wins,
        status,
        debut: span.debut,
      })
    );
  }
  log(`F1: ${records.length} drivers (full career, filtered to full-season regulars downstream).`);
  return records;
}
