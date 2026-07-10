/* F1DB release manager — downloads the official SQLite release artifact
   (CC BY 4.0, https://github.com/f1db/f1db), verifies its SHA-256
   against the release's checksums file, and caches it by release tag in
   .cache/f1db/<tag>/f1db.db so reruns cost zero requests.

   ATTRIBUTION: data sourced from F1DB requires a visible credit — the
   site footer and README carry "F1 data: F1DB (CC BY 4.0)". Keep that
   in place while this source is used. */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CONTACT } from "../config.js";

const REPO = "f1db/f1db";
const ASSET = "f1db-sqlite.zip";
const CACHE_ROOT = join(process.cwd(), ".cache", "f1db");

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": CONTACT, Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/* Look up the latest release (1 request, NOT disk-cached — "latest"
   changes after every race). If GitHub is unreachable but a previously
   downloaded release exists, fall back to the newest cached tag. */
async function resolveRelease(log) {
  try {
    const rel = await fetchJSON(`https://api.github.com/repos/${REPO}/releases/latest`);
    const asset = rel.assets.find((a) => a.name === ASSET);
    const checksums = rel.assets.find((a) => a.name === "checksums_sha256.txt");
    if (!asset) throw new Error(`release ${rel.tag_name} has no ${ASSET}`);
    return { tag: rel.tag_name, assetUrl: asset.browser_download_url, checksumsUrl: checksums?.browser_download_url };
  } catch (err) {
    const cached = existsSync(CACHE_ROOT) ? readdirSync(CACHE_ROOT).sort().reverse() : [];
    const usable = cached.find((tag) => existsSync(join(CACHE_ROOT, tag, "f1db.db")));
    if (usable) {
      log(`  ! F1DB release lookup failed (${err.message}) — using cached release ${usable}`);
      return { tag: usable, assetUrl: null, checksumsUrl: null };
    }
    throw err;
  }
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": CONTACT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function unzip(zipPath, destDir) {
  // Windows 10+/macOS ship bsdtar (as `tar`), which extracts .zip.
  // GNU tar (typical Linux) does not — fall back to `unzip` there.
  try {
    execFileSync("tar", ["-xf", zipPath, "-C", destDir], { stdio: "pipe" });
  } catch {
    execFileSync("unzip", ["-o", zipPath, "-d", destDir], { stdio: "pipe" });
  }
}

/* Returns { dbPath, tag } for the latest (or newest-cached) release. */
export async function ensureF1dbSqlite(log) {
  const rel = await resolveRelease(log);
  const dir = join(CACHE_ROOT, rel.tag);
  const dbPath = join(dir, "f1db.db");
  if (existsSync(dbPath)) {
    log(`F1DB: using cached release ${rel.tag}`);
    return { dbPath, tag: rel.tag };
  }

  mkdirSync(dir, { recursive: true });
  log(`F1DB: downloading ${ASSET} (release ${rel.tag})…`);
  const zip = await download(rel.assetUrl);

  if (rel.checksumsUrl) {
    const sums = (await download(rel.checksumsUrl)).toString("utf8");
    const line = sums.split("\n").find((l) => l.trim().endsWith(ASSET));
    const expected = line?.trim().split(/\s+/)[0]?.toLowerCase();
    const actual = createHash("sha256").update(zip).digest("hex");
    if (expected && expected !== actual) {
      throw new Error(`F1DB checksum mismatch for ${ASSET}: expected ${expected}, got ${actual}`);
    }
    log(`F1DB: checksum verified (${actual.slice(0, 12)}…)`);
  }

  const zipPath = join(dir, ASSET);
  writeFileSync(zipPath, zip);
  unzip(zipPath, dir);
  if (!existsSync(dbPath)) throw new Error(`extracted ${ASSET} but ${dbPath} not found`);
  log(`F1DB: ready at ${dbPath}`);
  return { dbPath, tag: rel.tag };
}
