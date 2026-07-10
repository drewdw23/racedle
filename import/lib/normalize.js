/* Normalization: map source nationality strings to the country names
   and continents the game's data.js uses, infer active/retired, and
   emit records in the exact DRIVERS shape. */

/* Ergast/Wikidata give demonyms ("British") or country labels
   ("United Kingdom"); the game keys on country names. Extend as new
   nationalities appear (the report flags unknowns). */
const DEMONYM_TO_COUNTRY = {
  American: "United States", British: "United Kingdom", English: "United Kingdom",
  Scottish: "United Kingdom", Welsh: "United Kingdom", "Northern Irish": "United Kingdom",
  German: "Germany", Italian: "Italy", French: "France", Spanish: "Spain",
  Dutch: "Netherlands", Finnish: "Finland", Australian: "Australia", Brazilian: "Brazil",
  Austrian: "Austria", Canadian: "Canada", Mexican: "Mexico", Swiss: "Switzerland",
  Swedish: "Sweden", Belgian: "Belgium", Japanese: "Japan", Danish: "Denmark",
  "New Zealander": "New Zealand", "New Zealand": "New Zealand", Argentine: "Argentina",
  Argentinian: "Argentina", Monegasque: "Monaco", Thai: "Thailand", Colombian: "Colombia",
  Venezuelan: "Venezuela", Russian: "Russia", Chinese: "China", Portuguese: "Portugal",
  Norwegian: "Norway", Estonian: "Estonia", Irish: "Ireland", "South African": "South Africa",
  Polish: "Poland", Czech: "Czech Republic", Indian: "India", Indonesian: "Indonesia",
  Hungarian: "Hungary", Liechtensteiner: "Liechtenstein", Uruguayan: "Uruguay",
  Chilean: "Chile", Rhodesian: "Zimbabwe",
};

const COUNTRY_TO_CONTINENT = {
  "United States": "North America", Canada: "North America", Mexico: "North America",
  Brazil: "South America", Argentina: "South America", Colombia: "South America",
  Venezuela: "South America", Uruguay: "South America", Chile: "South America",
  "United Kingdom": "Europe", Germany: "Europe", Italy: "Europe", France: "Europe",
  Spain: "Europe", Netherlands: "Europe", Finland: "Europe", Austria: "Europe",
  Switzerland: "Europe", Sweden: "Europe", Belgium: "Europe", Denmark: "Europe",
  Monaco: "Europe", Russia: "Europe", Portugal: "Europe", Norway: "Europe",
  Estonia: "Europe", Ireland: "Europe", Poland: "Europe", "Czech Republic": "Europe",
  Hungary: "Europe", Liechtenstein: "Europe",
  Japan: "Asia", Thailand: "Asia", China: "Asia", India: "Asia", Indonesia: "Asia",
  "United Arab Emirates": "Asia", Israel: "Asia",
  Australia: "Oceania", "New Zealand": "Oceania",
  "South Africa": "Africa", Zimbabwe: "Africa",
  Barbados: "North America",
};

/* Wikidata often returns a state's official long name; map to the short
   name the game uses. */
const COUNTRY_ALIAS = {
  "Kingdom of Denmark": "Denmark",
  "Kingdom of the Netherlands": "Netherlands",
  "United States of America": "United States",
  "Czechia": "Czech Republic",
  "State of Israel": "Israel",
};

export function toCountry(raw) {
  if (!raw) return null;
  let s = raw.trim();
  s = COUNTRY_ALIAS[s] || s.replace(/^Kingdom of (the )?/, "");
  return DEMONYM_TO_COUNTRY[s] || s;
}

export function continentOf(country) {
  return COUNTRY_TO_CONTINENT[country] || null;
}

/* Active if the driver has no recorded career-end and raced recently,
   or Wikidata "work period end" is empty and last season is within
   two years of now. */
export function inferStatus(lastSeason, workEnd, currentYear) {
  if (workEnd) return "Retired";
  if (lastSeason && currentYear - lastSeason <= 1) return "Active";
  return "Retired";
}

/* Produce a record in the game's shape. Fields left null are gaps the
   human curator must fill (reported in report.md). */
export function buildRecord({ name, country, series, team, titles, wins, status, debut }) {
  const continent = continentOf(country);
  return {
    name,
    country: country || null,
    continent: continent || null,
    series,
    team: team || null,
    titles: Number.isFinite(titles) ? titles : null,
    wins: Number.isFinite(wins) ? wins : null,
    status: status || null,
    debut: Number.isFinite(debut) ? debut : null,
    _complete: Boolean(country && continent && team && Number.isFinite(titles) && Number.isFinite(wins) && status && Number.isFinite(debut)),
  };
}

const SERIES_CONST = {
  "Formula 1": "SERIES.F1", "NASCAR Cup": "SERIES.NASCAR", IndyCar: "SERIES.INDYCAR",
  "CART / Champ Car": "SERIES.CART", "V8 Supercars": "SERIES.SUPERCARS",
  IMSA: "SERIES.IMSA", WEC: "SERIES.WEC", WRC: "SERIES.WRC",
};

/* Emit a data.js-compatible DRIVERS array string. Records missing
   required fields are written commented-out so they can't break the
   game, with a TODO the curator resolves. */
export function emitDataJs(records) {
  const q = (s) => JSON.stringify(s ?? "");
  const lines = records.map((r) => {
    const body =
      `{ name: ${q(r.name)}, country: ${q(r.country)}, continent: ${q(r.continent)}, ` +
      `series: ${SERIES_CONST[r.series] || q(r.series)}, team: ${q(r.team)}, ` +
      `titles: ${r.titles ?? "null"}, wins: ${r.wins ?? "null"}, ` +
      `status: ${q(r.status)}, debut: ${r.debut ?? "null"} },`;
    return r._complete ? "  " + body : "  // TODO(review): " + body;
  });
  return `/* GENERATED by import/run.js — review before merging into ../data.js */\nconst GENERATED_DRIVERS = [\n${lines.join("\n")}\n];\n`;
}
