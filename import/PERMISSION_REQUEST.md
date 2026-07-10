# Draft: data-reuse permission request (NOT yet sent)

Post this as a GitHub issue on **[kyleGrealis/nascaR.data](https://github.com/kyleGrealis/nascaR.data/issues)**
before shipping NASCAR data in the live game. It also, in effect, asks after the
DriverAverages.com permission chain — mention that upstream source explicitly.

**Do not send without the maintainer's handle filled in and a real contact.** Keep it short,
appreciative, and specific about the (small, factual, attributed) use.

---

**Title:** Permission to reuse Cup results data in a free (ad-supported) fan game, with attribution?

**Body:**

Hi, and thanks for maintaining nascaR.data — the coverage and weekly updates are excellent.

I'm building **Racedle**, a free, Wordle-style daily "guess the driver" game for motorsports
fans (https://github.com/drewdw23/racedle). It's a hobby project; if it gets traffic it may
carry display ads to cover hosting, so I want to be upfront that the use could be **commercial**.

I'd like to use the Cup Series dataset to build the NASCAR driver list. Concretely, I would:

- derive, **per driver**, only these facts: career race wins, first/last full-time season,
  most recent team, and whether they ran a full-time season since 1970;
- **not** redistribute your dataset or any bulk copy of it — only the handful of per-driver
  facts above end up in the game;
- **attribute** nascaR.data (and DriverAverages.com as the upstream source) in the game's
  data-credits footer, linking back to this repo.

Two questions:

1. Are you OK with this reuse (small set of per-driver facts, attributed, possibly
   ad-supported)? Is there a license you'd prefer I treat the data under?
2. Since the README notes the data was gathered with permission from DriverAverages.com — do
   you know whether that permission covers downstream reuse like this, or should I also reach
   out to them directly?

Happy to add any specific attribution wording you'd like. Thanks!

---

### Fallback if permission is declined or unanswered
The NASCAR roster can be rebuilt from CC-licensed sources instead: Wikipedia season
"Teams and drivers" tables (CC BY-SA) for the roster + the Wikipedia champions list for titles
+ Wikidata for nationality. This is lower-fidelity for exact start counts (so the full-time
filter gets coarser) but carries no licensing question. The pipeline's Wikipedia parser already
handles NASCAR season tables (76 entries parsed for 2015 in testing).
