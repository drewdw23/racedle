/* F1 source backed by F1DB (primary per DATA_SOURCES.md). Reads the
   release SQLite directly — no per-driver requests, no rate limits.

   Emits ONLY drivers who pass the full-time-season rule:
     started >= FULL_SEASON_FRACTION of the rounds held to date in at
     least one season >= YEAR_FROM.
   "Held to date" keeps the rule correct mid-season (a rookie who has
   started every round run so far qualifies).

   Field-mapping notes (verified against v2026.9.1 — see DATA_SOURCES.md):
   - debut/lastActive come from seasons with total_race_starts > 0;
     practice-only seasons create season_driver rows (Norris 2018).
   - team = constructor of the driver's most recent RACE_RESULT row,
     which resolves mid-season switches correctly; falls back to the
     latest non-test season entry.
   - country AND continent come from F1DB's relational data; the only
     mapping needed is continent "Australia" -> the game's "Oceania". */

import { DatabaseSync } from "node:sqlite";
import { ensureF1dbSqlite } from "../lib/f1db.js";
import { inferStatus } from "../lib/normalize.js";
import { YEAR_FROM, FULL_SEASON_FRACTION } from "../config.js";

const CONTINENT_MAP = { Australia: "Oceania" };
/* F1DB's official country names vs the short names the game uses. */
const COUNTRY_MAP = { "United States of America": "United States" };

export async function collectF1DB(currentYear, log) {
  const { dbPath, tag } = await ensureF1dbSqlite(log);
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const today = new Date().toISOString().slice(0, 10);

  const racesHeld = new Map(
    db.prepare(`SELECT year, COUNT(*) n FROM race WHERE date <= ? GROUP BY year`).all(today).map((r) => [r.year, r.n])
  );

  // Best single-season participation fraction per driver (seasons in scope).
  const bestFraction = new Map();
  for (const r of db.prepare(`SELECT driver_id, year, total_race_starts s FROM season_driver WHERE year >= ?`).all(YEAR_FROM)) {
    const held = racesHeld.get(r.year) || 0;
    if (!held) continue;
    const f = r.s / held;
    if (f > (bestFraction.get(r.driver_id) || 0)) bestFraction.set(r.driver_id, f);
  }

  const base = db.prepare(`
    SELECT d.id, d.name, c.name AS country, ct.name AS continent,
           d.total_championship_wins AS titles, d.total_race_wins AS wins,
           d.total_race_starts AS starts,
           MIN(CASE WHEN sd.total_race_starts > 0 THEN sd.year END) AS debut,
           MAX(CASE WHEN sd.total_race_starts > 0 THEN sd.year END) AS lastActive
    FROM driver d
    JOIN country c ON c.id = d.nationality_country_id
    JOIN continent ct ON ct.id = c.continent_id
    JOIN season_driver sd ON sd.driver_id = d.id
    GROUP BY d.id`).all();

  const lastRaceTeam = db.prepare(`
    SELECT co.name FROM race_data rd
    JOIN race r ON r.id = rd.race_id
    JOIN constructor co ON co.id = rd.constructor_id
    WHERE rd.driver_id = ? AND rd.type = 'RACE_RESULT'
    ORDER BY r.date DESC LIMIT 1`);
  const lastEntryTeam = db.prepare(`
    SELECT co.name FROM season_entrant_driver sed
    JOIN constructor co ON co.id = sed.constructor_id
    WHERE sed.driver_id = ? AND sed.test_driver = 0
    ORDER BY sed.year DESC LIMIT 1`);

  const records = [];
  for (const d of base) {
    const frac = bestFraction.get(d.id) || 0;
    if (frac < FULL_SEASON_FRACTION) continue;

    const team = lastRaceTeam.get(d.id)?.name || lastEntryTeam.get(d.id)?.name || null;
    const continent = CONTINENT_MAP[d.continent] || d.continent;
    const rec = {
      name: d.name,
      country: COUNTRY_MAP[d.country] || d.country,
      continent,
      series: "Formula 1",
      team,
      titles: d.titles,
      wins: d.wins,
      status: inferStatus(d.lastActive, null, currentYear),
      debut: d.debut,
      _complete: Boolean(d.country && continent && team && d.debut != null),
      _starts: d.starts,
      _bestSeasonFraction: Math.round(frac * 100) / 100,
      _f1dbId: d.id,
      _source: `f1db ${tag}`,
    };
    records.push(rec);
  }
  db.close();

  log(`F1 (F1DB ${tag}): ${records.length} full-time drivers (>= ${FULL_SEASON_FRACTION * 100}% of a season's held rounds, ${YEAR_FROM}+).`);
  return records;
}
