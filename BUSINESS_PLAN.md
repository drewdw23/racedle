# Motordle 🏁 — Business & Development Plan

*A daily "guess the motorsports driver" game in the mold of Wordle/Loldle. Version 1.0 of this plan — July 5, 2026.*

---

## 1. Executive summary

**Motordle** is a free, browser-based daily guessing game for motorsports fans. Each day, every player worldwide gets the same mystery driver drawn from F1, NASCAR Cup, IndyCar, CART/Champ Car, V8 Supercars, IMSA, WEC, WRC, and MotoGP. Players guess driver names; each guess reveals color-coded feedback across seven categories (nationality, primary series, current/last team, championships, race wins band, active/retired, debut decade) until the driver is found. Revenue comes from display advertising (Google AdSense), with negligible operating costs (static hosting is free; a custom domain is ~$12/year).

The model is proven: **Loldle** (League of Legends) turned the identical formula into millions of monthly visits with zero backend infrastructure. Motorsports is an underserved niche with a large, passionate, daily-engaged audience (F1 alone averages 70M+ viewers per race weekend) and a strong meme/share culture on Reddit, X, and TikTok.

**Status:** v1 is built and playable (this repo). Next steps: data verification, user testing, custom domain, AdSense application.

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
- Lesson 1: pick a fandom that already argues about trivia daily. Motorsports qualifies.
- Lesson 2: ship Classic mode first, then add modes to multiply engagement (see roadmap).
- Lesson 3: the daily reset time becomes a community ritual — publicize it (Motordle: 00:00 UTC).

### Competitive landscape
- Generic clone directories (wordle-clone lists) contain few or no polished motorsports entries.
- One-series games (an "F1 wordle") exist sporadically but multi-series coverage (F1 + NASCAR + IndyCar + MotoGP + WRC) is a differentiator that widens the audience — US oval fans, European open-wheel fans, bike fans, and rally fans in one funnel.
- Defensibility is low (anyone can clone), so speed, data quality, polish, and community are the moat.

---

## 3. Product & gameplay design

### Core loop (v1 — shipped)
1. Player types a driver name; autocomplete suggests from the database (340+ drivers).
2. On guess, a row of seven tiles flips, one per category:

| Category | 🟩 Green | 🟧 Orange (close) | ⬛ Gray |
|---|---|---|---|
| Nationality | Same country | Same continent | Different continent |
| Primary series | Exact match | — | Different |
| Current/last team | Exact match | — | Different |
| Championships won | Exact number | Off by one (+ ▲▼ hint) | Wrong (+ ▲▼ hint) |
| Race wins (banded: 0, 1–9, 10–24, 25–49, 50–99, 100+) | Same band | Adjacent band (+ ▲▼) | Farther (+ ▲▼) |
| Active/Retired | Match | — | Different |
| Decade debuted | Same decade | Adjacent decade (+ ▲▼) | Farther (+ ▲▼) |

3. Unlimited guesses (like Loldle). Win screen shows the driver, guess count, share button, and countdown to the next puzzle.
4. **Share** copies a spoiler-free emoji grid + link to the clipboard — the viral loop.
5. **Free play** mode offers unlimited random practice rounds (extra sessions = extra ad impressions) without touching daily stats.
6. Local stats: games played, win %, current/best streak, average guesses. Yesterday's answer is always shown (confirms fairness, resolves arguments).

### Design principles
- Answerable by feel: banded wins and decades mean casual fans can reason ("lots of wins, debuted 2010s, active, Europe… Verstappen?") rather than memorize exact stats.
- Banding also makes the database resilient to staleness — a driver winning three races mid-season rarely changes band.
- Every rule is stated in the How-to-play modal; ambiguity kills trust in trivia games.
- Dark, racing-flavored UI (red accent, checkered motif) that reads as "official-adjacent" without using any protected logos or photos.

---

## 4. Technical design

### Framework choice: zero-dependency static site (HTML/CSS/vanilla JS)
Deliberately **no** React/Vue/build pipeline for v1:
- The entire game is < 50 KB; a framework would multiply payload for no gain. Fast load = better SEO, better ad viewability, better mobile retention.
- No build step means GitHub Pages serves the repo as-is; contributors can edit `data.js` in the browser.
- No backend, no database, no server costs, nothing to get hacked or fall over on launch day. The daily puzzle is chosen client-side with a **deterministic seeded PRNG keyed to the UTC date**, so every player sees the same driver with zero server coordination (Loldle's trick).
- Migration path exists: if v3 needs accounts/leaderboards, add a thin API (Cloudflare Workers + KV) without touching the game core.

### Code architecture
```
motordle/
├── index.html        # page shell, modals, ad slots (AdSense-ready)
├── styles.css        # theme; CSS variables for palette
├── data.js           # driver database — single source of truth
├── game.js           # logic + rendering
├── privacy.html      # required for AdSense
└── BUSINESS_PLAN.md  # this document
```
- `game.js` keeps **pure logic** (`evaluateGuess`, `driverForPuzzle`, banding) separate from DOM code so unit tests can be added (roadmap: Vitest + GitHub Actions CI).
- State persists in `localStorage` (daily progress survives refresh; stats accumulate). No cookies of our own → simpler GDPR posture until ads arrive.
- Adding a driver = adding one object literal to `data.js`. Adding a series = one constant.

### Data strategy (the real product)
- The database now covers **340+ full-season drivers** across nine series: F1 (96), NASCAR Cup (88), IndyCar (33), CART/Champ Car (14), V8 Supercars (30), IMSA (17), WEC (20), WRC (35), MotoGP (10).
- Inclusion rule: completed at least one full season (or was an era-defining multi-season regular) in the series. Champions and race winners of every era are in; the exhaustive long tail of journeyman full-season drivers (thousands of people) is a **scripted-import project** — pull season entry lists from Wikipedia/official archives into the `data.js` schema, then human-verify. Do this only if testers ask for deeper cuts; obscure answers can hurt more than help.
- Documented editorial rules (in `data.js` header): one primary series per driver; championships = top-class titles only; debut = top-class debut; Active = full-time in primary series; team = current, or last for retired drivers.
- ⚠️ **Pre-launch task:** career stats are entered as of end-2024 season with 2025/26 team rosters (2025 titles included only where certain); every entry must be verified against current sources before public launch, starting with those marked `// verify`. Win *bands* buffer most staleness, but borderline drivers need checking.
- ⚠️ **Answer-pool churn:** the daily driver is picked by seeding into the array, so changing the database length re-rolls upcoming daily answers. Fine during testing; after public launch, curate a frozen answer calendar or an append-only answer pool separate from the guessable list.
- User testing doubles as data QA: the README and site footer invite error reports via GitHub Issues.

---

## 5. Business model

### Primary: Google AdSense display ads
Setup sequence (accounts can't be created programmatically — owner actions):
1. **Buy a custom domain** (e.g., `motordle.com` / `.io` / `.gg`, ~$12/yr). AdSense approval on a bare `*.github.io` subdomain is unreliable; a custom domain also protects the brand and makes the site portable. GitHub Pages supports custom domains free (repo Settings → Pages → Custom domain + DNS CNAME).
2. Apply at [adsense.google.com](https://adsense.google.com) with the Google account that should receive payouts. Requirements already satisfied by v1: original content, privacy policy page, navigable site. Approval typically takes days to a few weeks.
3. On approval, paste the AdSense `<script>` into `index.html` (the tag is already there, commented, with instructions) and replace the two placeholder `.ad-slot` divs with ad units. Recommended: one 728×90/responsive banner below the header, one below the game. **Never** interstitials or ads inside the game board — session length is the asset; don't poison it.
4. Configure Google's **CMP (consent management)** in AdSense settings for EEA/UK GDPR consent — this is built into AdSense and mandatory for EU traffic.
5. Payout at $100 threshold via bank transfer.

### Revenue math (games niche, display RPM ≈ $1–4)
| Stage | DAU | Pageviews/mo (~2/visit) | Est. revenue/mo |
|---|---|---|---|
| Soft launch | 100 | 6,000 | $6–24 |
| Traction | 1,000 | 60,000 | $60–240 |
| Loldle-tier niche hit | 20,000 | 1,200,000 | $1,200–4,800 |

Costs: domain $12/yr, hosting $0. Break-even is nearly immediate; upside is uncapped against fixed costs of ~$1/month.

### Secondary streams (post-traction, in order)
1. **"Buy me a coffee" / Ko-fi link** — zero effort, funds the domain.
2. **Affiliate links** — racing merch, sim-racing gear, F1 TV referrals where programs exist.
3. **Ad-free supporter tier** (~$2/mo via Stripe Payment Links) once traffic justifies it.
4. **Direct sponsorship** — sim-racing brands and betting-adjacent motorsports media buy niche audiences at far better rates than AdSense (only after real traffic numbers exist).

### Legal posture
- Driver names and statistics are **facts** — not copyrightable, and their use in a trivia game is standard practice (every almanac, fantasy league, and quiz app does the same).
- Stay clean: no driver photos, no team logos, no series wordmarks, no "F1" in the domain name. Footer disclaimer (shipped) states non-affiliation.
- Rebrand risk is low but nonzero; if a series objects, the game renames without losing its database or audience. Consult a lawyer before selling merch or using imagery.

---

## 6. Promotion plan

### Phase 0 — Private testing (now → 2 weeks)
- Share the GitHub Pages link with friends/Discords for feedback on difficulty, mobile UX, and **data errors** (GitHub Issues as the feedback channel).
- Fix data, tune category feedback (is continent-yellow too easy? too hard?).

### Phase 1 — Community seeding (weeks 2–6)
- **Reddit is the engine.** r/formula1 (4M+), r/NASCAR, r/INDYCAR, r/motogp, r/wrc, r/F1Feedback. **Read each sub's self-promo rules first** — the safe pattern is participating genuinely, then one well-timed "I made a free daily guessing game for us" post with a screenshot of a solved grid. Loldle's initial spike came from exactly one such Reddit post.
- Time launches to race weekends (Grand Prix Sunday = peak fan idle time) and to news moments (driver transfer announcements make "Current team" spicy).
- Discord: motorsports fan servers and sim-racing communities; offer the daily result as a shared ritual (servers make #motordle channels — this happened organically for Wordle).
- X/Twitter: post the daily grid, tag with race-weekend hashtags (#F1, #NASCAR75, GP-specific tags).

### Phase 2 — Content & SEO flywheel (months 2–6)
- SEO: the site already targets "f1 wordle", "nascar wordle", "motorsports guessing game" via title/meta. Add a short FAQ page for long-tail queries ("wordle for f1 fans"). Wordle-clone listicles and directories (there are dozens) accept submissions — get listed.
- TikTok/Shorts/Reels: 15-second "can you get today's Motordle in 3?" clips; racing TikTok is enormous and starving for interactive content.
- Streamers: pitch small motorsports YouTubers/streamers to open streams with the daily Motordle (Loldle became a stream-opening ritual for LoL streamers — the single biggest driver of its growth).

### Phase 3 — Retention & expansion (months 3+)
- Ship **new modes** (see roadmap) — every mode multiplies daily sessions, Loldle-style.
- Themed weeks (Monaco week: all-F1 answers; Daytona week: all-NASCAR) announced on socials.
- Community suggestion box for drivers to add; contributors credited. Fans defending "their" series' representation is free engagement.

### KPIs
- North star: **DAU** and **D7 retention** (are streaks forming?).
- Share rate (share clicks ÷ wins) — the viral coefficient proxy. Target >15%.
- Avg guesses per win (difficulty tuning: 4–7 is the fun zone).
- Once ads live: pageviews/session, RPM, viewability. Analytics via a lightweight privacy-friendly tool (Plausible/GoatCounter) or GA4.

---

## 7. Roadmap

| Version | Scope | Target |
|---|---|---|
| **v1.0** ✅ | Daily + free play, 7 categories, share, stats, ad slots ready | shipped |
| **v1.5** ✅ | 340+ full-season drivers across 9 series (F1, NASCAR, IndyCar, CART, V8 Supercars, IMSA, WEC, WRC, MotoGP) | shipped |
| v1.6 | Data verification pass (start with `// verify` entries), tester feedback fixes, colorblind mode, favicon/social-card images | +2 weeks |
| v1.7 | Custom domain, AdSense live, analytics; frozen daily-answer calendar; optional scripted import of the full-season long tail | +6 weeks |
| v2.0 | Second mode (e.g., **Career mode**: guess from a career-path clue chain — teams listed one by one), unit tests + CI, i18n groundwork (ES/PT/IT/FR fan bases are huge) | +3 months |
| v2.1 | Third mode (quote/radio-message mode or silhouette/helmet mode — needs licensing review for imagery), archive of past puzzles for new players | +5 months |
| v3.0 | Only if traction: accounts, global leaderboards, head-to-head race mode (thin serverless API) | 6–12 months |

---

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Data errors annoy hardcore fans | High (initially) | Testing phase = QA; visible "report an issue" link; fast fixes build goodwill |
| Clones copy the idea | Medium | Move fast, own the community, keep best data quality |
| AdSense rejection/delay | Medium | Custom domain + privacy policy + original content maximize approval odds; Ezoic/Monumetric as fallback networks |
| Series/team IP complaint | Low | No logos/photos; facts only; disclaimer; rename-ready |
| Daily-game fatigue (post-Wordle decline) | Medium | Niche fandoms retain far better than general-audience puzzles; modes + themed weeks refresh interest |
| Traffic spikes | Low impact | Static hosting scales for free |
