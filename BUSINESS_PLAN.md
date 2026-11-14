# Racedle 🏁 — Business & Development Plan

*A daily "guess the NASCAR driver" game in the mold of Wordle/Loldle. Version 2.0 of this plan — November 13, 2026.*

---

## 1. Executive summary

**Racedle** is a free, browser-based daily guessing game for NASCAR fans. Players pick a **mode** — **🏆 Ultimate** (every Cup driver since 1970) or a debut decade (**1970s, 1980s, 1990s, 2000s, 2010s, 2020s**) — and each day, every player worldwide gets the same mystery driver per mode. Players guess driver names; each guess reveals color-coded feedback across five categories (current/last team, Cup championships, Cup wins band, active/retired, debut decade) until the driver is found. Seven daily puzzles per player is the Loldle multi-mode engagement model, built in from the start. Revenue comes from display advertising (Google AdSense), with negligible operating costs (static hosting is free; a custom domain is ~$12/year).

The model is proven: **Loldle** (League of Legends) turned the identical formula into millions of monthly visits with zero backend infrastructure. NASCAR has a large, passionate, weekly-engaged fan base with deep history — decades of drivers, rivalries and stats that fans argue about — which is exactly what a daily trivia habit feeds on.

**Status:** live at https://drewdw23.github.io/racedle/ — 265 Cup drivers, seven modes, How to Play / FAQ / About / Privacy pages. Next steps: custom domain, Google Search Console, AdSense application, frozen daily-answer calendar.

---

## 2. Market analysis & the Loldle playbook

### Why Wordle-likes work
- **Daily scarcity** — one puzzle per day creates a habit loop and a reason to return tomorrow.
- **Shareable results** — the emoji grid is a spoiler-free brag that markets the game for free.
- **Zero friction** — no install, no account, no tutorial. First guess within 5 seconds of landing.
- **Streaks** — loss aversion keeps players coming back to protect their streak.

### Case study: Loldle (loldle.net)
- Launched July 2022 riding the Wordle wave; targeted at League of Legends' huge fanbase.
- Peaked at millions of visits/month with **no app, no accounts, no backend** — a static site.
- Key growth lever: **multiple daily modes** (Classic, Quote, Ability, Emoji, Splash). Each mode is another puzzle, another session, another set of ad impressions from the same visitor. Players who finish one mode roll into the next.
- Monetized with display ads; costs stayed near zero, so even modest RPMs were profitable.
- Lesson 1: pick a fandom that already argues about trivia daily. NASCAR qualifies.
- Lesson 2: ship Classic mode first, then add modes to multiply engagement. Racedle's decade modes are this lever — a 1980s fan and a 2010s fan each get "their" puzzle.
- Lesson 3: the daily reset time becomes a community ritual — publicize it (Racedle: 00:00 UTC).

### Competitive landscape
- NASCAR-themed guessing games exist sporadically; few combine a deep, accurate driver database with multiple daily modes.
- The decade modes let fans of every era play on their own turf — the veteran who knows the '70s and the new fan who started with the 2020s.
- Defensibility is low (anyone can clone), so speed, data quality, polish, and community are the moat.

---

## 3. Product & gameplay design

### Core loop (shipped)
1. Player picks a mode (defaults to 🏆 Ultimate — the full pool). Each mode has an independent daily driver, free-play mode, stats, and streaks, so a fan can play up to seven dailies per visit.
2. Player types a driver name; autocomplete suggests from that mode's pool (265 drivers in Ultimate).
3. On guess, a row of five tiles flips, one per category:

| Category | 🟩 Green | 🟧 Orange (close) | ⬛ Gray |
|---|---|---|---|
| Current/last team | Exact match | — | Different |
| Cup championships | Exact number | Off by one (+ ▲▼ hint) | Wrong (+ ▲▼ hint) |
| Cup wins (banded: 0, 1–9, 10–24, 25–49, 50–99, 100+) | Same band | Adjacent band (+ ▲▼) | Farther (+ ▲▼) |
| Active/Retired | Match | — | Different |
| Decade debuted (Ultimate only; hidden in decade modes) | Same decade | Adjacent decade (+ ▲▼) | Farther (+ ▲▼) |

4. Unlimited guesses (like Loldle). Win screen shows the driver, guess count, share button, and countdown to the next puzzle.
5. **Share** copies a spoiler-free emoji grid (tagged with the mode) + link to the clipboard — the viral loop.
6. **Free play** mode offers unlimited random practice rounds per mode (extra sessions = extra ad impressions) without touching daily stats.
7. Local stats per mode: games played, win %, current/best streak, average guesses. Yesterday's answer is always shown (confirms fairness, resolves arguments).

### Design principles
- Answerable by feel: banded wins and decades mean casual fans can reason ("lots of wins, debuted in the 2000s, still active… Kyle Busch?") rather than memorize exact stats.
- Banding also makes the database resilient to staleness — a driver winning three races mid-season rarely changes band.
- Every rule is stated in the How-to-play modal and page; ambiguity kills trust in trivia games.
- Dark, racing-flavored UI (red accent, checkered motif) that reads as racing without using any protected logos or photos.

---

## 4. Technical design

### Framework choice: zero-dependency static site (HTML/CSS/vanilla JS)
Deliberately **no** React/Vue/build pipeline:
- The entire game is small; a framework would multiply payload for no gain. Fast load = better SEO, better ad viewability, better mobile retention.
- No build step means GitHub Pages serves the repo as-is.
- No backend, no database, no server costs, nothing to get hacked or fall over on launch day. The daily puzzle is chosen client-side with a **deterministic seeded PRNG keyed to the UTC date**, so every player sees the same driver with zero server coordination (Loldle's trick).
- Migration path exists: if v3 needs accounts/leaderboards, add a thin API (Cloudflare Workers + KV) without touching the game core.

### Code architecture
```
racedle/
├── index.html          # game page, modals, ad slots (AdSense-ready)
├── how-to-play.html    # content pages (also AdSense/SEO content)
├── faq.html
├── about.html
├── privacy.html        # required for AdSense
├── styles.css          # theme; CSS variables for palette
├── data.js             # driver database + modes — generated, single source of truth
├── game.js             # logic + rendering
├── robots.txt, sitemap.xml, og-image.png
├── import/             # Wikipedia data pipeline (see import/DATA_SOURCES.md)
└── BUSINESS_PLAN.md    # this document
```
- `game.js` keeps **pure logic** (`evaluateGuess`, `driverForPuzzle`, banding) separate from DOM code so unit tests can be added (roadmap: Vitest + GitHub Actions CI).
- State persists in `localStorage` (daily progress survives refresh; stats accumulate). No cookies of our own → simpler GDPR posture until ads arrive.
- A mode is one line in `GENRES` in `data.js` (an id, a label, and the debut decades it draws from).

### Data strategy (the real product)
- The database covers **265 NASCAR Cup drivers**: everyone who started at least 60% of a Cup season's races in any season from 1970 on, including the legends who debuted earlier and raced into the '70s.
- **Source:** Wikipedia (CC BY-SA) — each season's points standings and "Teams and drivers" tables, and the list of Cup champions — assembled by the [import pipeline](import/) and written into `data.js` by a golden-tested merge. Details in [import/DATA_SOURCES.md](import/DATA_SOURCES.md).
- The 36 drivers who debuted before 1970 have their career wins and debut year hardcoded in the merge, since Wikipedia's pre-1970 season pages aren't reliable enough to count from.
- **Sourcing decision (do NOT scrape racing-reference.info):** it blocks automated access (403) and its Terms of Use forbid scraping and building tools on its data; bulk-copying it would also convert our "public facts" legal posture into a database-rights/ToU liability.
- Editorial rules (in `data.js` header): titles = Cup championships; wins = career Cup wins; debut = first Cup season; Active = full-time this season or last; team = current, or last for retired drivers.
- ⚠️ **Refresh cadence:** regenerate after every season finale at minimum (and every few weeks in season) so active drivers' wins, teams and titles stay current.
- ⚠️ **Answer-pool churn:** the daily driver is picked by seeding into each mode's pool, so changing a pool's size re-rolls upcoming daily answers. Before promoting widely, build a frozen answer calendar (pre-generated answers per date per mode) and publish data refreshes at the midnight-UTC rollover.
- User testing doubles as data QA: the README and site footer invite error reports via GitHub Issues.

---

## 5. Business model

### Primary: Google AdSense display ads
Setup sequence (accounts can't be created programmatically — owner actions):
1. **Buy a custom domain** (e.g., `racedle.com` / `.io` / `.gg`, ~$12/yr). AdSense approval on a bare `*.github.io` subdomain is unreliable; a custom domain also protects the brand and makes the site portable. GitHub Pages supports custom domains free (repo Settings → Pages → Custom domain + DNS CNAME).
2. Add the site to **Google Search Console** and submit `sitemap.xml`.
3. Apply at [adsense.google.com](https://adsense.google.com) with the Google account that should receive payouts. Already in place: original content pages (How to Play, FAQ, About), privacy policy with ad-cookie disclosures, cross-site navigation, robots.txt/sitemap. Approval typically takes days to a few weeks.
4. On approval, paste the AdSense `<script>` into `index.html` (the tag is already there, commented, with instructions) and replace the two placeholder `.ad-slot` divs with ad units. Recommended: one 728×90/responsive banner below the header, one below the game. **Never** interstitials or ads inside the game board — session length is the asset; don't poison it.
5. Configure Google's **CMP (consent management)** in AdSense settings for EEA/UK GDPR consent — this is built into AdSense and mandatory for EU traffic.
6. Payout at $100 threshold via bank transfer.

### Revenue math (games niche, display RPM ≈ $1–4)
| Stage | DAU | Pageviews/mo (~2/visit) | Est. revenue/mo |
|---|---|---|---|
| Soft launch | 100 | 6,000 | $6–24 |
| Traction | 1,000 | 60,000 | $60–240 |
| Loldle-tier niche hit | 20,000 | 1,200,000 | $1,200–4,800 |

Costs: domain $12/yr, hosting $0. Break-even is nearly immediate; upside is uncapped against fixed costs of ~$1/month.

### Secondary streams (post-traction, in order)
1. **"Buy me a coffee" / Ko-fi link** — zero effort, funds the domain.
2. **Affiliate links** — racing merch, diecast, sim-racing gear where programs exist.
3. **Ad-free supporter tier** (~$2/mo via Stripe Payment Links) once traffic justifies it.
4. **Direct sponsorship** — sim-racing brands and racing media buy niche audiences at far better rates than AdSense (only after real traffic numbers exist).

### Legal posture
- Driver names and statistics are **facts** — not copyrightable, and their use in a trivia game is standard practice (every almanac, fantasy league, and quiz app does the same).
- Stay clean: no driver photos, no team logos, no NASCAR marks or car-number artwork, no "NASCAR" in the domain name. Footer disclaimer (shipped) states non-affiliation.
- Rebrand risk is low but nonzero; if NASCAR or a team objects, the game renames without losing its database or audience. Consult a lawyer before selling merch or using imagery.

---

## 6. Promotion plan

### Phase 0 — Private testing (now → 2 weeks)
- Share the link with friends and NASCAR Discords for feedback on difficulty, mobile UX, and **data errors** (GitHub Issues as the feedback channel).
- Fix data, tune feedback (are deep-cut full-time drivers fun as daily answers? are five clues enough to solve in a reasonable number of guesses?).

### Phase 1 — Community seeding (weeks 2–6)
- **Reddit is the engine.** r/NASCAR is the core audience. **Read the sub's self-promo rules first** — the safe pattern is participating genuinely, then one well-timed "I made a free daily guessing game for us" post with a screenshot of a solved grid. Loldle's initial spike came from exactly one such Reddit post.
- Time launches to race weekends (Sunday Cup races = peak fan idle time) and to news moments (silly-season driver moves make "Current team" spicy).
- Discord: NASCAR fan servers and sim-racing communities; offer the daily result as a shared ritual (servers make #racedle channels — this happened organically for Wordle).
- X/Twitter: post the daily grid, tag with race-weekend hashtags (#NASCAR plus the race's own tag).

### Phase 2 — Content & SEO flywheel (months 2–6)
- SEO: the site targets "nascar wordle", "nascar driver guessing game" via title/meta, with How to Play / FAQ / About pages for long-tail queries. Wordle-clone listicles and directories (there are dozens) accept submissions — get listed.
- TikTok/Shorts/Reels: 15-second "can you get today's Racedle in 3?" clips.
- Streamers: pitch NASCAR YouTubers/streamers to open streams with the daily Racedle (Loldle became a stream-opening ritual for LoL streamers — the single biggest driver of its growth).

### Phase 3 — Retention & expansion (months 3+)
- Ship **new modes** (see roadmap) — every mode multiplies daily sessions, Loldle-style.
- Themed weeks (Daytona 500 week; a throwback week pushing the 1970s and 1980s modes) announced on socials.
- Community suggestion box for drivers to add; contributors credited.

### KPIs
- North star: **DAU** and **D7 retention** (are streaks forming?).
- Share rate (share clicks ÷ wins) — the viral coefficient proxy. Target >15%.
- Avg guesses per win (difficulty tuning: 4–7 is the fun zone).
- Once ads live: pageviews/session, RPM, viewability. Analytics via a lightweight privacy-friendly tool (Plausible/GoatCounter) or GA4 — the privacy policy must be updated first, since it currently says the site runs no analytics.

---

## 7. Roadmap

| Version | Scope | Target |
|---|---|---|
| **v1.0** ✅ | Daily + free play, clue categories, share, stats, ad slots ready | shipped |
| **v1.x** ✅ | Driver database, per-mode daily puzzles, Wikipedia import pipeline with golden tests, public launch on GitHub Pages, AdSense-readiness content pages | shipped |
| **v2.0** ✅ | NASCAR-only focus: 265 Cup drivers (1970+), Ultimate + six debut-decade modes (1970s–2020s; pre-1970 debutants in Ultimate), self-contained data build | shipped (Nov 2026) |
| v2.1 | Frozen daily-answer calendar (weighted toward recognizable drivers), end-of-2026 data refresh, custom domain, AdSense live | +4 weeks |
| v2.2 | Another mode (e.g., **Career mode**: guess from a career-path clue chain — teams listed one by one), unit tests + CI | +3 months |
| v2.3 | Archive of past puzzles for new players; colorblind mode | +5 months |
| v3.0 | Only if traction: accounts, global leaderboards, head-to-head race mode (thin serverless API) | 6–12 months |

---

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Data errors annoy hardcore fans | High (initially) | Testing phase = QA; visible "report an issue" link; fast fixes build goodwill |
| Obscure daily answers frustrate players | High | Weight the answer calendar toward drivers with wins/titles; keep everyone guessable |
| Clones copy the idea | Medium | Move fast, own the community, keep best data quality |
| AdSense rejection/delay | Medium | Custom domain + privacy policy + original content pages maximize approval odds; Ezoic/Monumetric as fallback networks |
| NASCAR/team IP complaint | Low | No logos/photos/marks; facts only; disclaimer; rename-ready |
| Daily-game fatigue (post-Wordle decline) | Medium | Niche fandoms retain far better than general-audience puzzles; modes + themed weeks refresh interest |
| Traffic spikes | Low impact | Static hosting scales for free |
