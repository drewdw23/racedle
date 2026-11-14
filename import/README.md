# Racedle data import pipeline (NASCAR Cup)

> **Source details:** see [DATA_SOURCES.md](DATA_SOURCES.md).

Builds the game's NASCAR Cup driver list from **license-clean, reuse-friendly public data**
(Wikipedia, CC BY-SA). It deliberately does **not** use racing-reference.info: that site blocks
automated access and its Terms of Use forbid scraping and building tools on its data. Copying it
would also undermine Racedle's own legal footing (the "public facts" defense).

## Requirements

- **Node.js 18+** (uses built-in `fetch`; no npm dependencies).

## Run

```bash
cd import
node run.js           # build the pool: every Cup season 1970 → current year
node merge-nascar.js  # golden-tested merge into ../data.js
```

Run from inside `import/` so the request cache lands in `import/.cache/`.

`run.js` writes to `import/output/` (git-ignored) and **never touches `../data.js`**:

- `drivers.generated.json` — every record with provenance.
- `data.generated.js` — the same rows in `DRIVERS` syntax; rows still missing a team are
  commented out with `// TODO(review):`.
- `report.md` — rows missing a team, plus drivers gained/lost versus the current `../data.js`.

`merge-nascar.js` then applies the two hardcoded tables (pre-1970 legends' career wins/debut,
and team fallbacks for old privateers), runs the golden tests, and rewrites the `DRIVERS` list
in `../data.js`. If any test fails, nothing is written.

Requests are throttled (~1/sec per host) and cached on disk (`.cache/`), so reruns are fast and
polite. Delete `.cache/` (or run `npm run clean`) to force a fresh pull, e.g. to pick up the
latest season.

### Rate limits & resuming

If Wikipedia rate-limits a run, it **does not crash**: a per-host circuit breaker trips, the run
finishes with whatever it has, and successful fetches stay cached — **just run `node run.js`
again** later and it resumes where it left off.

## Golden tests (merge-nascar.js)

The merge refuses to write unless:

- Every Cup champion since 1970 is present with at least one title.
- Anchors match (titles / wins / debut): Petty 7/200/1958, Pearson 3/105/1960,
  Yarborough 3/83/1957, Gordon 4/93/1992, Johnson 7/83/2001, Earnhardt 7/76/1975.
- Every hardcoded legend / team-fallback name is still in the generated pool.
- No legend's 1970+ win count exceeds its hardcoded career total.
- Shane van Gisbergen is New Zealand, Steve Park is present, no racetrack names leaked in.
- No duplicates, every country has a flag, and the pool is 240–290 drivers.

## Architecture

```
import/
├── config.js            # year range + full-time rule (60% of a season's races)
├── run.js               # orchestrator: collect → emit output/
├── merge-nascar.js      # hardcoded legends + team fallbacks, golden tests, write ../data.js
├── sources/
│   └── nascar.js        # season standings + "Teams and drivers" + champions list
├── lib/
│   ├── http.js          # throttle + retry + disk cache (built-in fetch)
│   ├── wikipedia.js     # MediaWiki API + tolerant HTML table parser
│   └── normalize.js     # status rule, data.js emitter
└── output/              # generated artifacts (git-ignored)
```
