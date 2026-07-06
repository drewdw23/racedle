/* Enrich a season roster (name -> {seasons}) into game records using
   Wikidata for nationality, career span, and status. Titles and wins
   for the non-F1 series are NOT reliably a single Wikidata number, so
   they are left null and flagged for curation (see report.md). F1 is
   already complete from Jolpica and skips this path. */

import { findDriver, driverFacts } from "./lib/wikidata.js";
import { toCountry, inferStatus, buildRecord } from "./lib/normalize.js";
import { FULL_SEASON_FRACTION } from "./config.js";

export async function enrichRoster(seriesId, seriesLabel, roster, currentYear, log) {
  const records = [];
  let i = 0;
  for (const [name, info] of roster) {
    i++;
    if (i % 25 === 0) log(`${seriesId}: enriched ${i}/${roster.size}`);

    const seasons = [...info.seasons].sort((a, b) => a - b);
    const debutFromSeasons = seasons[0];
    const lastSeason = seasons[seasons.length - 1];

    let country = null;
    let debut = debutFromSeasons;
    let workEnd = null;

    const hit = await findDriver(name);
    if (hit) {
      const facts = await driverFacts(hit.qid);
      country = toCountry(facts.citizenship);
      if (facts.workStart) debut = Math.min(debut, facts.workStart);
      workEnd = facts.workEnd;
    }

    records.push({
      ...buildRecord({
        name,
        country,
        series: seriesLabel,
        team: null, // last team needs the season page's team column — curation step
        titles: null, // per-series title count — curation step
        wins: null, // per-series win count — curation step
        status: inferStatus(lastSeason, workEnd, currentYear),
        debut,
      }),
      _seasons: seasons.length,
      _wikidata: hit ? hit.qid : null,
    });
  }
  return records;
}

export { FULL_SEASON_FRACTION };
