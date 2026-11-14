/* ============================================================
   Racedle import — configuration (NASCAR Cup only)
   ------------------------------------------------------------
   `series` is the exact string used in the game's data.js (must
   match SERIES.NASCAR there). The NASCAR source is self-contained:
   season article titles and table columns live in
   sources/nascar.js (see DATA_SOURCES.md).
   ============================================================ */

export const YEAR_FROM = 1970;
export const YEAR_TO = new Date().getUTCFullYear(); // inclusive

export const CONTACT = "racedle-import (https://github.com/drewdw23/racedle) - contact via GitHub issues";

export const SERIES_CONFIG = {
  nascar: {
    series: "NASCAR Cup",
    engine: "nascar", // Wikipedia (1970+): season points standings + "Teams and drivers" + champions list
  },
};

/* A full-time season = started at least this fraction of the season's
   races. The pool is every driver with a full-time season >= YEAR_FROM. */
export const FULL_SEASON_FRACTION = 0.6;
