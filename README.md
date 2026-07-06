# Motordle 🏁

**The daily motorsports driver guessing game** — a Wordle/Loldle-style game for racing fans.
Guess the mystery driver from **F1, NASCAR Cup, IndyCar, CART/Champ Car, V8 Supercars, IMSA,
WEC, WRC, and MotoGP** using clues across seven categories.

▶️ **Play it:** https://drewdw23.github.io/motordle/

## How to play

A new mystery driver drops every day at **00:00 UTC** (same driver for everyone). Type a name,
pick from the autocomplete, and each guess reveals seven tiles:

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
unlimited random practice rounds.

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
- Missing drivers you'd expect (340+ full-season drivers in the database).
- Mobile experience, bugs, confusing UI.

**[→ Open an issue](https://github.com/drewdw23/motordle/issues)** with anything you find.

## Project docs

- [BUSINESS_PLAN.md](BUSINESS_PLAN.md) — full business & development plan (framework choice,
  gameplay design, monetization/AdSense setup, promotion strategy, roadmap).

## Adding a driver

Add one object to `DRIVERS` in [data.js](data.js) following the editorial rules in the file
header (championships = top-class titles; debut = top-class debut; team = current, or last
team for retired drivers). PRs welcome during testing.

---

*Motordle is an unofficial fan-made game, not affiliated with Formula 1, NASCAR, IndyCar,
MotoGP, the FIA, or any team or driver. Driver data compiled from public sources.*
