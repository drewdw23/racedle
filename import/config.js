/* ============================================================
   Racedle import — configuration
   ------------------------------------------------------------
   One entry per series. `series` is the exact string used in the
   game's data.js (must match SERIES values there). `wikipedia`
   drives the generic season-entry-list scraper (sources/wikipediaSeasons.js);
   F1 is handled separately by the Jolpica client.

   season page titles: `titleFor(year)` returns the Wikipedia
   article title for that season. `sections` lists the section
   headings (case-insensitive substring match) that contain the
   full-season entry table — Wikipedia is not uniform, so several
   candidates are listed and the first that yields a driver column
   wins. `driverColumns` lists the likely column headers holding
   driver names.

   ⚠️ FIRST-RUN TUNING: Wikipedia table layouts vary by series and
   era. Run `node run.js --series=<id> --debug` and check
   output/report.md; if a season yields 0 drivers, adjust that
   series' `sections` / `driverColumns` here. This is expected and
   documented in README.md.
   ============================================================ */

export const YEAR_FROM = 1970;
export const YEAR_TO = new Date().getUTCFullYear(); // inclusive; completed seasons only are validated downstream

export const CONTACT = "racedle-import (https://github.com/drewdw23/racedle) - contact via GitHub issues";

export const SERIES_CONFIG = {
  f1: {
    series: "Formula 1",
    engine: "f1db", // primary: F1DB SQLite release (see DATA_SOURCES.md)
    validator: "jolpica", // independent cross-check via --validate
  },

  nascar: {
    series: "NASCAR Cup",
    engine: "nascar", // Wikipedia/Wikidata (1970+): season standings + "Teams and drivers"
    // + champions list (see DATA_SOURCES.md §5). Reworked 2026 off the nascaR.data
    // parquet — sources/nascar.js is self-contained (season titles/columns live there).
  },

  indycar: {
    series: "IndyCar",
    engine: "indycar", // modern IndyCar (2008+): entries Round(s) + winners table + champions (see DATA_SOURCES.md §6)
    wikipedia: {
      titleCandidates: (y) => [
        `${y} IndyCar Series`,
        `${y} IndyCar Series season`,
        `${y} IRL IndyCar Series`,
        `${y} Indy Racing League`,
        `${y} USAC Championship Car season`,
      ],
      sections: ["Entries", "Entry list", "Teams and drivers", "Drivers"],
      driverColumns: ["Driver", "Drivers"],
    },
  },

  supercars: {
    series: "V8 Supercars",
    engine: "supercars", // Wikipedia season "Teams and drivers" (Driver+Rounds, two-tier header) + winners + ATCC champions (DATA_SOURCES.md §9)
    wikipedia: {
      titleCandidates: (y) => [
        `${y} Supercars Championship`,
        `${y} V8 Supercars Championship`,
        `${y} V8 Supercar season`,
        `${y} Australian Touring Car Championship`,
      ],
      sections: ["Teams and drivers", "Entries", "Entry list", "Drivers"],
      driverColumns: ["Driver", "Drivers"],
    },
  },

  imsa: {
    series: "IMSA",
    engine: "endurance", // top-class entries table (first in Entries) + Rounds + top-class standings (DATA_SOURCES.md §10)
    endurance: {
      from: 2014, // modern unified IMSA SportsCar Championship; pre-2014 stays hand-curated
      titleFn: (y) => [
        `${y} IMSA SportsCar Championship`,
        `${y} United SportsCar Championship`,
      ],
      // Top-class (Prototype/DPi/GTP) drivers' co-champions per season
      // (Wikipedia "List of IMSA SportsCar Championship champions"). IMSA's
      // per-season standings tables are too irregular to parse reliably, so
      // titles come from this hardcoded, verifiable map.
      champions: {
        2014: ["João Barbosa", "Christian Fittipaldi"],
        2015: ["João Barbosa", "Christian Fittipaldi"],
        2016: ["Dane Cameron", "Eric Curran"],
        2017: ["Jordan Taylor", "Ricky Taylor"],
        2018: ["Eric Curran", "Felipe Nasr"],
        2019: ["Dane Cameron", "Juan Pablo Montoya"],
        2020: ["Hélio Castroneves", "Ricky Taylor"],
        2021: ["Felipe Nasr", "Pipo Derani"],
        2022: ["Tom Blomqvist", "Oliver Jarvis"],
        2023: ["Pipo Derani", "Alexander Sims"],
        2024: ["Dane Cameron", "Felipe Nasr"],
        2025: ["Matt Campbell", "Mathieu Jaminet"],
      },
    },
  },

  wec: {
    series: "WEC",
    engine: "endurance", // top-class entries table (first in Entries) + Rounds + top-class standings (DATA_SOURCES.md §7)
    endurance: {
      from: 2012, // FIA WEC start; pre-2012 World Sportscar legends stay hand-curated
      titleFn: (y) => [
        `${y} FIA World Endurance Championship season`,
        `${y} FIA World Endurance Championship`,
        // 2018–19 and 2019–20 ran as hyphenated "superseasons".
        `${y}–${String(y + 1).slice(2)} FIA World Endurance Championship`,
        `${y - 1}–${String(y).slice(2)} FIA World Endurance Championship`,
      ],
      // Top-class (LMP1/Hypercar) Drivers' World Champions per season
      // (superseasons keyed by their first year). Hardcoded for the same
      // reason as IMSA — the per-season standings vary too much to parse.
      champions: {
        2012: ["André Lotterer", "Benoît Tréluyer", "Marcel Fässler"],
        2013: ["Allan McNish", "Tom Kristensen", "Loïc Duval"],
        2014: ["Anthony Davidson", "Sébastien Buemi"],
        2015: ["Timo Bernhard", "Mark Webber", "Brendon Hartley"],
        2016: ["Marc Lieb", "Romain Dumas", "Neel Jani"],
        2017: ["Timo Bernhard", "Brendon Hartley", "Earl Bamber"],
        2018: ["Sébastien Buemi", "Fernando Alonso", "Kazuki Nakajima"], // 2018–19
        2019: ["Mike Conway", "Kamui Kobayashi", "José María López"], // 2019–20
        2021: ["Mike Conway", "Kamui Kobayashi", "José María López"],
        2022: ["Sébastien Buemi", "Brendon Hartley", "Ryō Hirakawa"],
        2023: ["Sébastien Buemi", "Brendon Hartley", "Ryō Hirakawa"],
        2024: ["Kévin Estre", "André Lotterer", "Laurens Vanthoor"],
        2025: ["James Calado", "Antonio Giovinazzi", "Alessandro Pier Guidi"],
      },
    },
  },

  wrc: {
    series: "WRC",
    engine: "wrc", // Wikipedia season "Teams and drivers" (Driver+Rounds) + winners + champions (see DATA_SOURCES.md §8)
    wikipedia: {
      titleCandidates: (y) => [
        `${y} World Rally Championship season`,
        `${y} World Rally Championship`,
      ],
      sections: ["Entries", "Entry list", "Crews", "Drivers"],
      driverColumns: ["Driver", "Drivers"],
    },
  },
};

/* A driver "completed a full season" heuristic: appeared in the
   season's entry-list table. Where the season page exposes a round
   count and a per-driver rounds column, downstream can tighten this
   to >= FULL_SEASON_FRACTION of rounds; by default, entry-list
   presence is treated as a full-season regular (matches how the
   hand-curated seed was built). */
export const FULL_SEASON_FRACTION = 0.6;

/* Only emit drivers whose earliest detected season is >= this year
   (the task scope: "back to 1970"). Their pre-1970 record still
   counts toward career totals during enrichment. */
export const SCOPE_DEBUT_FROM = null; // null = keep anyone who ran a full season in-range, regardless of debut
