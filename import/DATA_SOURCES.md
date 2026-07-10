# Data source plan — reliable, license-clean driver data per series

*Goal: for each series, a source that can answer our exact inclusion rule — "drivers from
1970 onward who completed a full-time season" — with accurate stats for all seven game
categories, under a license compatible with an ad-supported (commercial) game.*

This document starts with **F1 (evaluated and empirically verified)** and defines the rubric
the other series will be held to.

---

## 1. Source evaluation rubric (applies to every series)

| Criterion | Why it matters |
|---|---|
| **Per-season granularity** | "Completed a full-time season" needs starts-per-season vs rounds-per-season. Career totals alone can't answer it (the Max Jean problem: 1 start in 1971 still shows up in season standings). |
| **Field coverage** | Must supply or derive all 7 game categories: nationality, series, current/last team, championships, career wins, active/retired, debut year. |
| **License permits commercial use** | The game will run ads. CC0 / CC BY / CC BY-SA / Apache-2.0 are fine (with attribution where required). "Non-commercial" or scraping-prohibited ToU are disqualifying (see racing-reference decision in BUSINESS_PLAN.md). |
| **Access mode** | Bulk download ≫ API ≫ scraping. Bulk has no rate limits and reruns are free. |
| **Currency & cadence** | Teams/titles change; the source must update within days of races. |
| **Maintenance risk** | Prefer actively maintained, community-verifiable projects; always keep a second source for cross-validation. |

## 2. F1 — evaluated candidates

| Source | License | Access | Verdict |
|---|---|---|---|
| **F1DB** ([github.com/f1db/f1db](https://github.com/f1db/f1db)) | **CC BY 4.0** (commercial OK, attribution required) | Bulk releases (SQLite 15 MB zip, also JSON/CSV/SQL), updated after every race | ✅ **PRIMARY** |
| **Jolpica-F1** ([github.com/jolpica/jolpica-f1](https://github.com/jolpica/jolpica-f1)) | Apache-2.0; community successor to Ergast (which was non-commercial) | REST API, 500 req/hr unauthenticated, 4/sec burst | ✅ **VALIDATOR** (cross-check + between-release freshness); already integrated |
| Wikipedia [List of Formula One drivers](https://en.wikipedia.org/wiki/List_of_Formula_One_drivers) | CC BY-SA | One parseable page: entries, starts, wins, titles per driver | ✅ Tertiary cross-check |
| Wikidata | CC0 | SPARQL | Nationality tie-breaker only (career stats too sparse) |
| racing-reference.info | ToU forbids scraping/derivatives; 403s bots | — | ❌ rejected (documented in BUSINESS_PLAN.md) |
| formula1.com / StatsF1 / Forix | Restrictive ToU, scraping-hostile | — | ❌ manual spot-checks only |
| Kaggle Ergast dumps | Stale (Ergast froze end-2024), NC lineage | — | ❌ |
| OpenF1 API | Open | 2023+ only | ❌ no historical coverage |

### Why F1DB wins
Verified empirically on release **v2026.9.1** (2026-07-06) — the SQLite artifact was downloaded
and queried directly (Node's built-in `node:sqlite`):

- **Current to within days**: most recent race in the DB was the 2026 British GP run on
  2026-07-05, the day before the release. Team joins return 2026 rosters (Verstappen → Red
  Bull, Hülkenberg → Audi, Pérez → Cadillac).
- **Career totals are precomputed** on `driver` (total_championship_wins, total_race_wins,
  total_race_starts, …) — no accumulation logic to maintain, unlike the Jolpica standings scan.
- **Per-season starts exist** (`season_driver.total_race_starts`), which is the one thing the
  Jolpica standings feed could not tell us — it's what makes the full-time-season rule
  computable at all.
- **Nationality and continent come as data** (`driver.nationality_country_id` → `country` →
  `continent`), eliminating our demonym-mapping table and its gaps (the "Alex Yoong
  [Malaysian/null]" class of bug).
- Rich schema (JSON Schema published), 30 tables incl. season entrants, standings, and
  per-race results for future game modes (poles, podiums, fastest laps are already there).

## 3. The full-time-season rule, operationalized

> A driver qualifies if, in **at least one season ≥ 1970**, they **started ≥ 60% of that
> season's rounds held to date**.

- "Held to date" makes the rule correct mid-season: a 2026 rookie with 9 starts of 9 rounds
  run so far qualifies (100%), instead of being penalized against the full 24-round calendar.
- 60% (config: `FULL_SEASON_FRACTION`, already in `config.js`) absorbs injury-shortened
  full-time campaigns while excluding one-off drives.

**Verified against the actual data (v2026.9.1):**

| Check | Result |
|---|---|
| Pool size, 1970+ at 60% | **257 drivers** (vs 485 unfiltered — cuts 47% noise; current merged F1 set is 386) |
| Max Jean (1 start, 1971) | excluded ✅ |
| Markus Winkelhock (1 start, 2007) | excluded ✅ |
| Niki Lauda 1976 (injury year: 14 of 16 rounds = 88%) | still full-time ✅ |
| Every World Champion active 1970+ | all 257-pool members ✅ (zero missing) |
| Kimi Antonelli (2026 rookie-era driver) | included ✅ |

### Field-mapping subtleties found during verification
- **Debut must be `MIN(year WHERE total_race_starts > 0)`**, not first `season_driver` row —
  practice-only seasons create rows (Norris has a 2018 FP-only row; his race debut is 2019.
  Same for Antonelli 2024 vs real debut 2025).
- **Match on `driver.name`** (display name), not `full_name` (legal name: "Max Emilian
  Verstappen").
- Cross-series dedup stays accent-insensitive ("Sébastien Bourdais" vs existing "Sebastien
  Bourdais") and dual-career drivers keep their non-F1 primary series, as in the last merge.

## 4. Implementation plan — ✅ implemented 2026-07-08

Status: steps 1–4 and 6 are live. `node run.js --series=f1` uses F1DB; `--validate` cross-checks
Jolpica (first run: 253 drivers matched, **zero title/win disagreements**; 44 cosmetic
team-naming / historical-debut variances logged in report.md); `node merge-f1.js` runs the
golden tests and rewrote data.js to the trimmed pool (251 F1 = 241 full-timers + 10 legends).

1. **New source `import/sources/f1db.js`** *(replaces the Jolpica scan as primary)*:
   download `f1db-sqlite.zip` from the latest GitHub release (version-pinned, checksum from
   `checksums_sha256.txt`, cached by tag in `.cache/`), extract, query via `node:sqlite`,
   emit records already filtered by the full-time rule. No rate limits, single request.
2. **Keep the Jolpica source as a validator**: `node run.js --series=f1 --validate` runs both
   and diffs titles/wins/team per driver, writing disagreements into `output/report.md` for
   human review. Two independent sources catching each other is the reliability story.
3. **Golden tests** (plain Node asserts, no framework): all 1970+ champions present; zero
   drivers with < 60% best-season starts; spot-check rows (Lauda 3/25, Verstappen, Piastri);
   no null country/continent/team; no accent-duplicate names.
4. **Attribution (license requirement)**: add "F1 data: [F1DB](https://github.com/f1db/f1db)
   (CC BY 4.0)" to the site footer and README when F1DB-sourced data ships.
5. **Refresh cadence**: rerun after each Grand Prix (releases land within ~a day). Later:
   a monthly GitHub Action that opens a PR with the regenerated data diff.
6. **Merge**: regenerate → trim the live 386-driver F1 set to the 257 full-timers → same
   dedup/preserve rules as the last merge (pre-1970 legends kept by hand).

## 5. NASCAR Cup — evaluated candidates (verified 2026-07-10)

| Source | License / lineage | Access | Verdict |
|---|---|---|---|
| **nascaR.data** ([github.com/kyleGrealis/nascaR.data](https://github.com/kyleGrealis/nascaR.data)) | GPL-3 (package); data scraped **with permission** from DriverAverages.com — no explicit data license (see caveat) | Bulk Parquet on Cloudflare R2 (`https://nascar.kylegrealis.com/cup_series.parquet`, ~1 MB), auto-updated Mondays in season | ✅ **PRIMARY** (with license action item) |
| Wikipedia [List of NASCAR Cup Series champions](https://en.wikipedia.org/wiki/List_of_NASCAR_Cup_Series_champions) | CC BY-SA | One page | ✅ **TITLES SOURCE** (nascaR.data has no standings) |
| Wikipedia season articles ("Teams and drivers") | CC BY-SA | Already parse (2015 → 76 entries) | ✅ Roster cross-validator |
| Wikidata | CC0 | SPARQL | Nationality for the handful of non-US drivers |
| racing-reference.info | ToU forbids scraping/derivatives; 403s bots | — | ❌ rejected (see §2) |
| NASCAR.com internal feeds (cf.nascar.com) | Undocumented, no public license/ToU | JSON | ❌ same category as scraping the official site |
| SportsDataIO / Sportradar NASCAR APIs | Commercial, paid | API | ❌ cost-prohibitive for a free game |
| Neil-Paine-1/NASCAR-data (GitHub) | No license; racing-reference lineage | CSV | ❌ tainted lineage, staleness risk |
| Kaggle NASCAR datasets | Mostly racing-reference scrapes, stale | — | ❌ |

### Why nascaR.data wins — verified empirically
Downloaded `cup_series.parquet` (982 KB, parsed with the pure-JS `hyparquet` reader) and ran
the full evaluation:

| Check | Result |
|---|---|
| Coverage | **100,856 race-result rows, 1949–2026** (78 seasons); per-row: Season, Race, Driver, Finish, Start, Team, Make, Laps, Led, Win |
| Currency | **19 races of 2026 recorded** — exactly the season's progress; teams current (Larson→Hendrick, Johnson→Legacy MC, SVG→Trackhouse) |
| Historical accuracy | Races/season correct (1975 = 30, 2015 = 36); career wins **exactly match canon**: Petty 200, Pearson 105, Gordon 93, Johnson 83 |
| Full-time rule (≥60% of season's races, some season ≥1970) | **249-driver pool** (of 1,094 who appear 1970+ — cuts 77% one-race noise); data contains only run races, so the current season is naturally "held to date" |
| Champions sanity | All 26 champions since 1970 in the pool; one-to-three-start drivers excluded |
| Active grid | 45 full-timers with 2026 starts ≈ the real charter grid |

### Gaps and mitigations
- **No championships data** → titles from the Wikipedia champions list. **Verified parseable**
  with the existing table parser: Petty/Earnhardt/Johnson = 7, Gordon = 4, Larson = 2 (incl.
  2025), Logano = 3.
- **No nationality** → default "United States" + a small exceptions map (van Gisbergen→NZ,
  Suárez→Mexico, Ambrose→Australia, Montoya→Colombia, Villeneuve→Canada, Earl Ross→Canada, …),
  cross-checkable via Wikidata.
- **⚠️ Data-license caveat (the one real weakness vs F1DB):** the dataset has no explicit
  license; its legitimacy rests on DriverAverages' permission *to that project*, which doesn't
  automatically extend downstream. Mitigations: (1) **action item — open a GitHub issue asking
  kyleGrealis/DriverAverages for an explicit OK** for reuse in a free ad-supported game with
  attribution; (2) the values we extract are uncopyrightable facts (wins, starts, teams), and
  we re-derive nothing else; (3) attribute both nascaR.data and DriverAverages in the data
  credits; (4) the Wikipedia validator path means the roster could be rebuilt from CC sources
  if permission is declined.
- **Parquet-only** → requires `hyparquet` (tiny, pure-JS, MIT) — the import tool's first npm
  dependency (the game itself stays dependency-free).

### Implementation sketch (when approved)
`sources/nascar.js`: download the 1 MB parquet (cache by ETag) → aggregate per driver (starts
per season → full-time rule; wins = Σ Finish 1; debut/last/status from seasons with starts;
team = team of most recent start) → titles joined from the champions page → nationality map →
`merge-nascar.js` gated by golden tests (all champions present, Petty 200/7, SVG nationality,
no one-race leakage, flag coverage).

## 6. Applying the rubric to the remaining series

The template stands: *bulk, openly-licensed, per-season-granular database first; API second;
Wikipedia/Wikidata as cross-checks; scraping-hostile stat sites never*. Candidate leads to
evaluate (unverified until given the F1DB/NASCAR treatment):

- **IndyCar / CART**: same approach; Wikipedia season pages are strong for entrants.
- **WRC**: ewrc-results.com is the de-facto stats DB — **check ToU before anything**; else
  Wikipedia season pages.
- **V8 Supercars / IMSA / WEC**: Wikipedia season pages + heavy curation (multi-class and
  co-driver noise), as flagged in README.md.

Each series gets the same deliverable as this doc's §2–3: an evaluated source table and an
empirically verified full-season pool before any merge.
