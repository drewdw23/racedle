# Racedle 🏁

**The daily motorsports driver guessing game** — a Wordle/Loldle-style game for racing fans.
Guess the mystery driver from **F1, NASCAR Cup, IndyCar, V8 Supercars, IMSA, WEC, and WRC**
using clues across seven categories. Pick a genre — **Formula 1, NASCAR, IndyCar, V8 Supercars,
Endurance, Rally** — or play **🏆 Ultimate** across the whole database.
Every genre has its own daily puzzle, free play, and stats.

▶️ **Play it:** https://drewdw23.github.io/racedle/

## How to play

A new mystery driver drops every day at **00:00 UTC** in every genre (same driver for
everyone). Type a name, pick from the autocomplete, and each guess reveals seven tiles:

| Tile | Green 🟩 | Orange 🟧 | Gray ⬛ |
|---|---|---|---|
| Nationality | same country | same continent | — |
| Primary series | match | — | — |
| Current/last team | match | — | — |
| Championships | exact | off by one (▲▼ hint) | ▲▼ hint |
| Race wins (banded) | same band | adjacent band (▲▼) | ▲▼ |
| Active/Retired | match | — | — |
| Decade debuted | same decade | adjacent decade (▲▼) | ▲▼ |

Unlimited guesses. Share your spoiler-free emoji grid when you win. **Free play** mode gives
unlimited random practice rounds in whichever genre you're playing. Streaks and stats are
tracked per genre — protect them all.

## Run it locally

No build step, no dependencies — it's a plain static site:

1. Clone the repo.
2. Open `index.html` in a browser. That's it.

(Or serve the folder with any static server for a proper URL.)

## Testing & feedback — we need you! 🧪

This is **v1 for user testing.** Things we want to hear about:

- **Data errors** — wrong team, wrong title count, wrong debut decade, someone marked
  Active who retired. Stats were compiled through the 2024 season (see the note in
  [data.js](data.js)) and are being verified; entries marked `// verify` are the shakiest.
- Difficulty — too easy? too hard? is the continent hint too generous? Are deep-cut
  full-season drivers fun or frustrating as daily answers?
- Missing drivers you'd expect (333 full-season drivers in the database).
- Genre groupings — Endurance covers IMSA + WEC.
  Should any genre be split out or combined differently?
- Mobile experience, bugs, confusing UI.

**[→ Open an issue](https://github.com/drewdw23/racedle/issues)** with anything you find.

## Project docs

- [BUSINESS_PLAN.md](BUSINESS_PLAN.md) — full business & development plan (framework choice,
  gameplay design, monetization/AdSense setup, promotion strategy, roadmap).

## Adding a driver

Non-F1 series: add one object to `DRIVERS` in [data.js](data.js) following the editorial rules
in the file header (championships = top-class titles; debut = top-class debut; team = current,
or last team for retired drivers). PRs welcome during testing.

F1 is **generated, not hand-edited**: the section is produced from F1DB by the import pipeline
(`cd import && node run.js --series=f1 && node merge-f1.js`) — see
[import/DATA_SOURCES.md](import/DATA_SOURCES.md). Report F1 data errors upstream or as an issue
here and we'll re-verify.

## Data credits

- **F1 driver data:** [F1DB](https://github.com/f1db/f1db), licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cross-validated against the
  [Jolpica-F1](https://github.com/jolpica/jolpica-f1) API.
- **NASCAR Cup driver data (1970+):** assembled from [Wikipedia](https://en.wikipedia.org/)
  season pages (points standings, "Teams and drivers", the champions list; CC BY-SA) and
  [Wikidata](https://www.wikidata.org/) (CC0). Full-career wins/debut for the pre-1970 legends
  are carried from the prior dataset. *(Reworked off the nascaR.data parquet in 2026.)*
- **IndyCar driver data (modern, 2008+):** assembled from [Wikipedia](https://en.wikipedia.org/)
  season pages + champions/winners lists (CC BY-SA) and [Wikidata](https://www.wikidata.org/) (CC0).
  Pre-2008 IndyCar/USAC legends are hand-curated.
- Other series: compiled from public sources (Wikipedia/Wikidata), verification ongoing.

---

*Racedle is an unofficial fan-made game, not affiliated with Formula 1, NASCAR, IndyCar,
Supercars, IMSA, the FIA, or any series, team or driver.*
