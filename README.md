# Racedle 🏁

**The daily NASCAR driver guessing game** — a Wordle/Loldle-style game for NASCAR fans.
Guess the mystery **NASCAR Cup Series** driver using clues across six categories. Play
**🏆 Ultimate** across every era, or pick a decade — **1950s–60s, 1970s, 1980s, 1990s, 2000s,
2010s, 2020s** — to play only the drivers who debuted then. Every mode has its own daily puzzle,
free play, and stats.

▶️ **Play it:** https://drewdw23.github.io/racedle/

## How to play

A new mystery driver drops every day at **00:00 UTC** in every mode (same driver for
everyone). Type a name, pick from the autocomplete, and each guess reveals six tiles:

| Tile | Green 🟩 | Orange 🟧 | Gray ⬛ |
|---|---|---|---|
| Nationality | same country | same continent | — |
| Current/last team | match | — | — |
| Cup championships | exact | off by one (▲▼ hint) | ▲▼ hint |
| Cup wins (banded) | same band | adjacent band (▲▼) | ▲▼ |
| Active/Retired | match | — | — |
| Decade debuted | same decade | adjacent decade (▲▼) | ▲▼ |

Unlimited guesses. Share your spoiler-free emoji grid when you win. **Free play** mode gives
unlimited random practice rounds in whichever mode you're playing. Streaks and stats are
tracked per mode.

## Run it locally

No build step, no dependencies — it's a plain static site:

1. Clone the repo.
2. Open `index.html` in a browser. That's it.

(Or serve the folder with any static server for a proper URL.)

## Testing & feedback 🧪

Things we want to hear about:

- **Data errors** — wrong team, wrong title count, wrong debut decade, someone marked
  Active who retired.
- Difficulty — too easy? too hard? Are deep-cut full-time drivers fun or frustrating as daily
  answers?
- Missing drivers you'd expect (265 drivers: everyone with a full-time Cup season since 1970).
- Mobile experience, bugs, confusing UI.

**[→ Open an issue](https://github.com/drewdw23/racedle/issues)** with anything you find.

## Project docs

- [BUSINESS_PLAN.md](BUSINESS_PLAN.md) — business & development plan (gameplay design,
  monetization/AdSense setup, promotion strategy, roadmap).
- [import/DATA_SOURCES.md](import/DATA_SOURCES.md) — where the NASCAR data comes from and how
  it's built.

## Driver data

The driver list in [data.js](data.js) is **generated, not hand-edited**: the import pipeline
builds it from Wikipedia and a golden-tested merge writes it in:

```bash
cd import && node run.js && node merge-nascar.js
```

A driver is included if they started at least 60% of a Cup season's races in any season from
1970 on. The 36 drivers who debuted before 1970 (Petty, Pearson, Yarborough, …) have their
career wins and debut year hardcoded in [import/merge-nascar.js](import/merge-nascar.js), since
Wikipedia's pre-1970 season pages aren't reliable enough to count from. Report data errors as
an issue and we'll re-verify.

## Data credits

- **NASCAR Cup driver data:** assembled from [Wikipedia](https://en.wikipedia.org/) (CC BY-SA)
  — each season's points standings and "Teams and drivers" tables, and the list of Cup Series
  champions.

---

*Racedle is an unofficial fan-made game, not affiliated with, endorsed by, or associated with
NASCAR or any team or driver.*
