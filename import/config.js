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
    engine: "nascar", // primary: nascaR.data Cup parquet (see DATA_SOURCES.md §5)
    // Wikipedia config retained as the fallback roster source (see
    // PERMISSION_REQUEST.md) and for the season-table validator.
    wikipedia: {
      // "1971 NASCAR Winston Cup Series", "2004 NASCAR Nextel Cup Series",
      // "2015 NASCAR Sprint Cup Series", "2020 NASCAR Cup Series" — the name
      // changed over the years, so we try several and use the first that exists.
      titleCandidates: (y) => [
        `${y} NASCAR Cup Series`,
        `${y} NASCAR Sprint Cup Series`,
        `${y} NASCAR Nextel Cup Series`,
        `${y} NASCAR Winston Cup Series`,
        `${y} NASCAR Grand National Series`,
      ],
      sections: ["Full-time", "Entry list", "Teams and drivers", "Drivers"],
      driverColumns: ["Driver", "Driver(s)"],
    },
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

  cart: {
    series: "CART / Champ Car",
    engine: "wikipedia",
    wikipedia: {
      titleCandidates: (y) => [
        `${y} Champ Car season`,
        `${y} CART season`,
        `${y} CART World Series season`,
        `${y} PPG Indy Car World Series season`,
        `${y} Champ Car World Series season`,
      ],
      sections: ["Entries", "Entry list", "Teams and drivers", "Drivers"],
      driverColumns: ["Driver", "Drivers"],
    },
  },

  supercars: {
    series: "V8 Supercars",
    engine: "wikipedia",
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
    engine: "wikipedia",
    wikipedia: {
      // NOTE: the entry-list table lists ALL classes (GTP/LMDh + LMP2 +
      // GTD/GT). The scraper returns everyone; filtering to the top class
      // (and dropping gentleman/am co-drivers) is a curation step. Same
      // applies to WEC below.
      titleCandidates: (y) => [
        `${y} IMSA SportsCar Championship`,
        `${y} WeatherTech SportsCar Championship season`,
        `${y} Rolex Sports Car Series season`,
        `${y} IMSA GT Championship season`,
        `${y} IMSA Camel GT Championship season`,
      ],
      sections: ["Entries", "Entry list", "Teams and drivers"],
      driverColumns: ["Drivers", "Driver"],
    },
  },

  wec: {
    series: "WEC",
    engine: "wikipedia",
    wikipedia: {
      titleCandidates: (y) => [
        `${y} FIA World Endurance Championship season`,
        `${y} FIA World Endurance Championship`,
        `${y} World Sportscar Championship season`,
        `${y} World Championship for Makes season`,
      ],
      sections: ["Entries", "Entry list", "Teams and drivers"],
      driverColumns: ["Drivers", "Driver"],
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
