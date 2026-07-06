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

/* GET a URL expecting JSON, with disk cache + retry. */
export async function getJSON(url, { retries = 4 } = {}) {
  const cp = cachePath(url);
  if (existsSync(cp)) {
    try {
      return JSON.parse(readFileSync(cp, "utf8"));
    } catch {
      /* corrupt cache entry — fall through and refetch */
    }
  }

  let attempt = 0;
  for (;;) {
    await throttle(url);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": CONTACT, Accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
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
      return data;
    } catch (err) {
      if (attempt++ >= retries) throw err;
      const backoff = 1500 * 2 ** attempt;
      process.stderr.write(`  retry ${attempt}/${retries} after ${backoff}ms (${err.message}) ${url}\n`);
      await sleep(backoff);
    }
  }
}

export function isHttpError(v) {
  return v && typeof v === "object" && "__httpError" in v;
}
