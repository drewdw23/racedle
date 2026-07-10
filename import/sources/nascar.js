/* NASCAR Cup source (primary per DATA_SOURCES.md §5). Reads the
   nascaR.data Cup Parquet and emits drivers who ran a full-time season
   (>= FULL_SEASON_FRACTION of a season's races, some season >= YEAR_FROM).

   The results feed has per-race rows but NO standings and NO nationality,
   so:
   - titles come from Wikipedia's "List of NASCAR Cup Series champions"
   - nationality defaults to United States with a small exceptions map
     (NASCAR is overwhelmingly American; the non-US regulars are named).

   ⚠️ Data license is pending (PERMISSION_REQUEST.md) — do not ship the
   merged NASCAR data until that resolves. */

import { parquetReadObjects } from "hyparquet";
import { ensureCupParquet } from "../lib/nascar.js";
import { getFullPageHtml, parseTables } from "../lib/wikipedia.js";
import { continentOf, inferStatus } from "../lib/normalize.js";
import { YEAR_FROM, FULL_SEASON_FRACTION } from "../config.js";

/* Non-US full-time Cup regulars (default is United States). Keyed by the
   exact Driver string in the parquet; verify against the pool on each run. */
const NATIONALITY = {
  "Shane van Gisbergen": "New Zealand",
  "Marcos Ambrose": "Australia",
  "Daniel Suarez": "Mexico",
  "Daniel Suárez": "Mexico",
  "Juan Pablo Montoya": "Colombia",
  "Jacques Villeneuve": "Canada",
  "Earl Ross": "Canada",
  "Patrick Carpentier": "Canada",
  "Max Papis": "Italy",
  "Dario Franchitti": "United Kingdom",
};

async function titlesFromChampions(log) {
  const html = await getFullPageHtml("List of NASCAR Cup Series champions");
  // The page has several tables (chronological champions, champions-by-count,
  // by manufacturer, …). Use ONLY the chronological one — the single largest
  // table with Season + Driver columns — so titles aren't double-counted.
  let best = null;
  for (const t of parseTables(html)) {
    const header = t.find((r) => r.some((c) => c.header));
    if (!header) continue;
    const cols = header.map((c) => c.text.toLowerCase());
    const yi = cols.findIndex((c) => c.includes("season") || c.includes("year"));
    const di = cols.findIndex((c) => c.includes("driver"));
    if (yi === -1 || di === -1) continue;
    if (!best || t.length > best.rows.length) best = { rows: t, yi, di };
  }
  const titles = new Map();
  if (best) {
    for (const r of best.rows) {
      const y = parseInt(r[best.yi]?.text, 10);
      const name = r[best.di]?.links?.[0] || r[best.di]?.text;
      if (!Number.isFinite(y) || y < 1949 || y > 2100 || !name) continue;
      titles.set(name, (titles.get(name) || 0) + 1);
    }
  }
  log(`NASCAR: parsed ${[...titles.values()].reduce((a, b) => a + b, 0)} champion seasons from Wikipedia (${titles.size} champions)`);
  return titles;
}

const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.'\-]/g, " ").replace(/\s+/g, " ").trim();
const cleanTeam = (t) => (t ? t.replace(/\s*\(owner\)\s*$/i, "").trim() : null);

export async function collectNascar(currentYear, log) {
  const ab = await ensureCupParquet(log);
  const rows = await parquetReadObjects({ file: ab });
  log(`NASCAR: ${rows.length} Cup result rows (nascaR.data)`);

  // Races held per season (feed contains only run races → current season
  // is naturally "held to date").
  const racesHeld = new Map();
  for (const r of rows) {
    const y = Number(r.Season);
    if (!racesHeld.has(y)) racesHeld.set(y, new Set());
    racesHeld.get(y).add(Number(r.Race));
  }
  for (const [y, s] of racesHeld) racesHeld.set(y, s.size);

  // Aggregate per driver.
  const drivers = new Map();
  for (const r of rows) {
    const name = r.Driver;
    if (!name) continue;
    let d = drivers.get(name);
    if (!d) {
      d = { name, startsBySeason: new Map(), wins: 0, last: { y: -1, race: -1, team: null } };
      drivers.set(name, d);
    }
    const y = Number(r.Season);
    d.startsBySeason.set(y, (d.startsBySeason.get(y) || 0) + 1);
    if (Number(r.Win) === 1) d.wins += 1;
    const race = Number(r.Race);
    if (y > d.last.y || (y === d.last.y && race > d.last.race)) d.last = { y, race, team: r.Team };
  }

  const titles = await titlesFromChampions(log);
  const titlesByStripped = new Map([...titles].map(([k, v]) => [strip(k), v]));

  const records = [];
  for (const d of drivers.values()) {
    const fullTime = [...d.startsBySeason].some(
      ([y, n]) => y >= YEAR_FROM && racesHeld.get(y) && n >= FULL_SEASON_FRACTION * racesHeld.get(y)
    );
    if (!fullTime) continue;

    const years = [...d.startsBySeason.keys()].sort((a, b) => a - b);
    const country = NATIONALITY[d.name] || "United States";
    records.push({
      name: d.name,
      country,
      continent: continentOf(country),
      series: "NASCAR Cup",
      team: cleanTeam(d.last.team),
      titles: titlesByStripped.get(strip(d.name)) || 0,
      wins: d.wins,
      status: inferStatus(years[years.length - 1], null, currentYear),
      debut: years[0],
      _complete: Boolean(country && continentOf(country) && cleanTeam(d.last.team) && years[0]),
      _starts: [...d.startsBySeason.values()].reduce((a, b) => a + b, 0),
      _source: "nascaR.data",
    });
  }

  log(`NASCAR: ${records.length} full-time drivers (>= ${FULL_SEASON_FRACTION * 100}% of a season's races, ${YEAR_FROM}+).`);
  return records;
}
