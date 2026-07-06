/* Generic season-roster source for the non-F1 series. For each year
   in range it finds the season article, locates the entry-list table,
   and collects driver names. Names are enriched later (enrich.js).

   Returns a Map: driverName -> { seasons:Set<year> }. The caller
   applies the full-season rule and enrichment. */

import { resolveTitle, getSections, getSectionHtml, getFullPageHtml, parseTables, driversFromTables } from "../lib/wikipedia.js";
import { YEAR_FROM, YEAR_TO } from "../config.js";

export async function collectSeasonRosters(seriesId, cfg, log, debug) {
  const roster = new Map();
  const wiki = cfg.wikipedia;

  for (let year = YEAR_FROM; year <= YEAR_TO; year++) {
    const title = await resolveTitle(wiki.titleCandidates(year));
    if (!title) {
      if (debug) log(`  ${seriesId} ${year}: no season article found`);
      continue;
    }

    // Find the section whose heading matches one of the configured
    // entry-list headings; fall back to scanning the whole page.
    const sections = await getSections(title);
    let html = "";
    const match = sections.find((s) =>
      wiki.sections.some((want) => s.line.toLowerCase().includes(want.toLowerCase()))
    );
    if (match) html = await getSectionHtml(title, match.index);
    if (!html) html = await getFullPageHtml(title);

    const tables = parseTables(html);
    const names = driversFromTables(tables, wiki.driverColumns);

    for (const name of names) {
      if (!roster.has(name)) roster.set(name, { seasons: new Set() });
      roster.get(name).seasons.add(year);
    }
    if (debug) log(`  ${seriesId} ${year}: "${title}" -> ${names.length} drivers`);
  }

  log(`${seriesId}: ${roster.size} unique drivers across ${YEAR_FROM}-${YEAR_TO}`);
  return roster;
}
