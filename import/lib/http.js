/* Polite HTTP client: throttling, retry with backoff, and an
   on-disk JSON cache so reruns don't re-hit the APIs. Uses Node 18+
   built-in fetch (no dependencies). */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CONTACT } from "../config.js";

const CACHE_DIR = join(process.cwd(), ".cache");
mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Per-host minimum gap between requests (ms). Wikimedia and Jolpica
   both ask for courteous rates; keep this conservative. */
const HOST_GAP_MS = 1100;
const lastHit = new Map();

async function throttle(url) {
  const host = new URL(url).host;
  const now = Date.now();
  const wait = (lastHit.get(host) || 0) + HOST_GAP_MS - now;
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
}

function cachePath(url) {
  const h = createHash("sha1").update(url).digest("hex");
  return join(CACHE_DIR, `${h}.json`);
}

/* Circuit breaker: once a host has rate-limited us repeatedly, stop
   hammering it for the rest of the process. A per-hour limit (like
   Jolpica's, with no Retry-After) will not clear inside one run, so
   continuing to retry every request just wastes ~an hour. Instead we
   trip the breaker and fail fast, telling the user to rerun later
   (cached successes are reused, so the rerun resumes). */
const RL_TRIP_THRESHOLD = 3;
const rlCount = new Map();
const tripped = new Set();

function hostOf(url) {
  return new URL(url).host;
}

/* GET a URL expecting JSON, with disk cache + retry + circuit breaker. */
export async function getJSON(url, { retries = 4 } = {}) {
  const cp = cachePath(url);
  if (existsSync(cp)) {
    try {
      return JSON.parse(readFileSync(cp, "utf8"));
    } catch {
      /* corrupt cache entry — fall through and refetch */
    }
  }

  const host = hostOf(url);
  if (tripped.has(host)) return { __httpError: 429, __tripped: true };

  let attempt = 0;
  for (;;) {
    await throttle(url);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": CONTACT, Accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get("retry-after"));
        throw Object.assign(new Error(`HTTP ${res.status}`), {
          status: res.status,
          retryAfterMs: Number.isFinite(ra) && ra > 0 ? ra * 1000 : null,
        });
      }
      if (!res.ok) {
        // 404 etc. are real answers (e.g. a season page that doesn't exist);
        // cache a null so we don't retry them forever.
        const nullVal = { __httpError: res.status };
        writeFileSync(cp, JSON.stringify(nullVal));
        return nullVal;
      }
      const data = await res.json();
      writeFileSync(cp, JSON.stringify(data));
      rlCount.set(host, 0); // a success clears the rate-limit streak
      return data;
    } catch (err) {
      // Exhausted retries: DO NOT throw (that would abort the whole run
      // and lose all progress). Return a sentinel so callers skip this
      // item and the run finishes with partial data. Transient failures
      // aren't cached, so a later rerun retries them (rate limits like
      // Jolpica's reset hourly). Successful earlier calls stay cached, so
      // reruns resume rather than restart.
      if (attempt++ >= retries) {
        if (err.status === 429) {
          const n = (rlCount.get(host) || 0) + 1;
          rlCount.set(host, n);
          if (n >= RL_TRIP_THRESHOLD && !tripped.has(host)) {
            tripped.add(host);
            process.stderr.write(`  ! ${host} keeps rate-limiting (HTTP 429). Backing off for the rest of this run — rerun later to finish (cached progress is kept).\n`);
          }
        }
        process.stderr.write(`  gave up after ${retries} retries (${err.message}) — skipping ${url}\n`);
        return { __httpError: err.status || "error" };
      }
      // Honor Retry-After when present; otherwise exponential backoff,
      // capped (a per-hour limit with no Retry-After won't clear in the
      // window, so don't sleep absurdly long — just bail to the sentinel).
      const backoff = err.retryAfterMs || Math.min(30000, 1500 * 2 ** attempt);
      process.stderr.write(`  retry ${attempt}/${retries} after ${backoff}ms (${err.message}) ${url}\n`);
      await sleep(backoff);
    }
  }
}

export function isHttpError(v) {
  return v && typeof v === "object" && "__httpError" in v;
}
