# Data sources — NASCAR Cup driver data

*Goal: a source that answers the game's inclusion rule — "NASCAR Cup drivers who ran a
full-time season from 1970 onward" — with accurate values for all five clue categories, under a
license compatible with an ad-supported (commercial) game.*

---

## 1. Source evaluation rubric

| Criterion | Why it matters |
|---|---|
| **Per-season granularity** | "Ran a full-time season" needs starts-per-season vs races-per-season. Career totals alone can't answer it — a one-race start still appears in a season's standings. |
| **Field coverage** | Must supply or derive every field the game uses: current/last team, Cup championships, career Cup wins, active/retired, debut year. |
| **License permits commercial use** | The game will run ads. CC0 / CC BY / CC BY-SA are fine (with attribution where required). "Non-commercial" or scraping-prohibited terms are disqualifying. |
| **Access mode** | Bulk download ≫ API ≫ scraping. Cached, polite access keeps reruns cheap. |
| **Currency & cadence** | Teams, wins and titles change every season; the source must keep up. |
| **Maintenance risk** | Prefer community-maintained, verifiable sources, and keep golden tests to catch drift. |

## 2. Candidates evaluated

| Source | License / lineage | Verdict |
|---|---|---|
| **Wikipedia** — each "YYYY NASCAR Cup Series" season article (points standings, "Teams and drivers") | CC BY-SA | ✅ **PRIMARY** — roster, starts, wins, teams |
| **Wikipedia** — [List of NASCAR Cup Series champions](https://en.wikipedia.org/wiki/List_of_NASCAR_Cup_Series_champions) | CC BY-SA | ✅ **TITLES** |
| nascaR.data ([github.com/kyleGrealis/nascaR.data](https://github.com/kyleGrealis/nascaR.data)) | GPL-3 package; data gathered with permission from DriverAverages.com, no explicit data license | ⏸ Used July–August 2026 with the maintainer's permission, then retired so the game has no external data dependency (see [PERMISSION_REQUEST.md](PERMISSION_REQUEST.md)) |
| racing-reference.info | Terms of Use forbid scraping and derivative tools; blocks bots | ❌ rejected |
| NASCAR.com internal feeds | Undocumented, no public license | ❌ same category as scraping the official site |
| SportsDataIO / Sportradar NASCAR APIs | Commercial, paid | ❌ cost-prohibitive for a free game |
| Kaggle / GitHub NASCAR CSVs | Mostly racing-reference scrapes, unlicensed, stale | ❌ |

## 3. The full-time-season rule

> A driver qualifies if, in **at least one season ≥ 1970**, they **started ≥ 60% of that
> season's races**.

- 60% (`FULL_SEASON_FRACTION` in `config.js`) absorbs injury-shortened full-time campaigns while
  excluding one-off and part-time entries.
- Applied to the 1970→now standings it yields a **266-driver** generated pool (265 after the merge
  drops one driver with no recorded team).

## 4. How the build works — `sources/nascar.js`

For every season from 1970 to the current year:

- **Season article** — tried under each historical series name (Grand National, Winston Cup,
  Nextel Cup, Sprint Cup, Monster Energy, Cup Series). A result is accepted only if its title
  contains the year: bare names like "1968 NASCAR Cup Series" redirect to the generic series page.
- **Starts + wins** ← the **points-standings** table, in one of two layouts:
  - *Early-1970s summary table*: a starts count ("Starts", "St" or "Races") plus "Wins".
  - *Modern per-race grid*: a started race is a non-empty result cell; a win is a finish of "1".
- **Full-time** = starts ≥ 60% of that season's races.
- **Team** ← the season's "Teams and drivers" entry table (Driver → Team), most recent season.
- **Titles** ← the champions list, counting each champion **year once** — the older rows are
  rowspan-duplicated in the HTML (Joe Weatherly's 1963 appears 9×). Titles are career totals,
  including pre-1970 championships.
- **Debut / wins / status** — debut is the first 1970+ season, wins are summed across 1970+
  seasons, and status is Active if the last full-time season is this year or last.
- **Venue filter** — racetrack names that appear in the tables as linked text ("Infineon
  Raceway") are rejected; the filter avoids surname-like words ("Park") so Steve Park survives.

## 5. The merge — `merge-nascar.js`

The merge is self-contained: nothing is carried over from the existing `data.js`. Two hardcoded
tables fill what the 1970+ season pages can't:

- **`LEGENDS`** — the **36 drivers who debuted before 1970** (Petty, Pearson, Bobby Allison,
  Yarborough, Isaac, Baker, …). Their career Cup wins and real debut year are hardcoded; counting
  only from 1970 would give Petty 99 wins and a 1970 debut. These drivers are long retired, so the
  values are final. They were taken from per-race Cup records.
- **`TEAM_FALLBACK`** — last team for 25 older privateers (including 1970 champion Bobby Isaac)
  whose season entry tables list no team. Used only when the build finds none.

Golden tests (nothing is written if any fails): every Cup champion since 1970 present with ≥ 1
title; anchors Petty 7/200/1958, Pearson 3/105/1960, Yarborough 3/83/1957, Gordon 4/93/1992,
Johnson 7/83/2001, Earnhardt 7/76/1975; every hardcoded name still in the pool; no legend's 1970+
count above its hardcoded career total; Steve Park present; no venue names; no duplicates;
pool size 240–290.

## 6. Refresh

```bash
cd import
npm run clean      # drop the request cache to pull the latest season pages
node run.js
node merge-nascar.js
```

Run after the season finale at minimum, and ideally every few weeks in season so active drivers'
wins and teams stay current. Note that changing a mode's pool size changes that mode's daily
answers (they're chosen by index into the pool), so publish refreshes at the midnight-UTC rollover.

## 7. Known gaps

- **Status is generous** — a driver whose last full-time season was last year still shows
  Active for the whole current year.
- **1970s debuts can read a year or two late** for minor drivers: some early-'70s standings
  tables list only the top finishers. The debut *decade* is unaffected except at decade
  boundaries.
