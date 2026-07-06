# Racedle data import pipeline

Builds the driver database from **license-clean, reuse-friendly public sources** — the only
sustainable way to reach "every full-season driver since 1970, all series." It deliberately
does **not** use racing-reference.info: that site blocks automated access and its Terms of Use
forbid scraping and building tools on its data. Copying it would also undermine Racedle's own
legal footing (the "public facts" defense). See [../BUSINESS_PLAN.md](../BUSINESS_PLAN.md).

## Sources

| Series | Source | Why |
|---|---|---|
| Formula 1 | **Jolpica-F1** API (the open successor to Ergast, retired end-2024) | Structured JSON, F1 1950–present: nationality, per-season champion, career wins, debut. No scraping needed. |
| NASCAR, IndyCar, CART, V8 Supercars, IMSA, WEC, WRC | **Wikipedia** season articles (CC BY-SA) for the entry lists + **Wikidata** (CC0) for nationality/career span/status | Wikidata's SPARQL is queryable and public-domain; Wikipedia season pages are the reliable place to find who ran a full season. |

## Requirements

- **Node.js 18+** (uses built-in `fetch`; no npm dependencies to install). This repo's dev
  machine had no Node — install it first: <https://nodejs.org>.

## Run

```bash
cd import
node run.js                  # all series, 1970 → current year
node run.js --series=f1       # one series
node run.js --series=wrc,imsa --debug   # subset with per-season logging
```

Outputs land in `import/output/` (git-ignored) and **never touch `../data.js` directly**:

- `drivers.generated.json` — every record with provenance (`_seasons`, `_wikidata` qid).
- `data.generated.js` — paste-ready `DRIVERS` entries. **Incomplete rows are commented out**
  with `// TODO(review):` so they can never break the game.
- `report.md` — coverage per series, rows needing curation, and a **validation diff against the
  current `../data.js`** (which hand-curated drivers the pipeline did/didn't re-find, and which
  new drivers it discovered).

Requests are throttled (~1/sec per host) and cached on disk (`.cache/`), so reruns are fast and
polite. `node run.js` after a full run costs almost nothing.

## What the pipeline gets reliably vs. what needs curation

**Reliable, automatic:** the roster (who ran a full season each year), nationality → continent,
debut year, and active/retired status. F1 is fully complete (titles, wins, last team included)
because Jolpica exposes all of it.

**Needs a curation pass (non-F1):** `team` (last/current), `titles`, and `wins`. These are not a
single dependable number in Wikidata across every series/era, so the pipeline leaves them `null`
and the row stays commented out until a human fills them from the driver's Wikipedia infobox or
an official series record. This is by design — better a flagged gap than a wrong stat shown in
the game.

## ⚠️ First-run tuning (expected)

The table parser handles the hard parts automatically — **rowspan/colspan** grids (so NASCAR
team tables don't bleed crew chiefs into the driver column), **multi-tier headers** (e.g. a
"Championship entries" super-header above the real "Driver name" row), and **flag-icon links**
(so nationalities don't get mistaken for names). All eight series parse their modern
(2010s) season pages out of the box, verified on 2015.

What still needs attention on a full 1970→present run:

- **Older eras** (1970s–90s) use different table layouts and section headings. If specific
  years yield **0 drivers** in `output/report.md`, add that era's section heading or
  driver-column label to the series' `sections` / `driverColumns` / `titleCandidates` in
  [`config.js`](config.js). Run one series with `--debug` to see per-season hit counts.
- **Endurance (WEC/IMSA)** rosters include every class (LMP2, GTD/GTE, gentleman co-drivers).
  Filtering to the top class is a curation decision, not something the scraper guesses.
- The **Wikidata occupation filter** drops entities Wikidata knows aren't drivers (crew chiefs,
  owners); anyone with unknown occupation is kept and flagged for review.

## Merge workflow

1. `node run.js` → review `output/report.md`.
2. Curate `data.generated.js`: fill `TODO(review)` rows (team/titles/wins), delete non-full-season
   noise, resolve name-spelling mismatches flagged in the report.
3. Move validated entries into `../data.js` under the right series block.
4. Add any new `country` values to the `FLAGS` map in `../data.js` (the report lists unknowns).
5. Reload the game and sanity-check (`node run.js` doesn't run the game — open `../index.html`).

## Architecture

```
import/
├── config.js               # per-series source config + year range + full-season rule
├── run.js                  # orchestrator: collect → dedupe → validate → emit
├── enrich.js               # roster → records via Wikidata (non-F1)
├── sources/
│   ├── f1.js               # Jolpica/Ergast (complete records)
│   └── wikipediaSeasons.js  # generic season entry-list scraper (config-driven)
├── lib/
│   ├── http.js             # throttle + retry + disk cache (built-in fetch)
│   ├── jolpica.js          # F1 API client
│   ├── wikidata.js         # SPARQL client
│   ├── wikipedia.js        # MediaWiki API + tolerant HTML table parser
│   └── normalize.js        # country/continent maps, status, data.js emitter
└── output/                 # generated artifacts (git-ignored)
```
