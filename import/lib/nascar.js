/* nascaR.data release manager — downloads the Cup Series Parquet from
   the project's public Cloudflare R2 bucket and caches it, revalidating
   with the stored ETag so an unchanged file is a single 304 (the data
   only changes weekly in-season).

   DATA PROVENANCE / LICENSE: the nascaR.data project
   (https://github.com/kyleGrealis/nascaR.data, GPL-3 code) gathered
   this data with permission from DriverAverages.com. There is no
   explicit data license; reuse in the shipped game is gated on the
   permission request in PERMISSION_REQUEST.md. Attribute both projects
   in the site footer when NASCAR data goes live. */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTACT } from "../config.js";

const URL = "https://nascar.kylegrealis.com/cup_series.parquet";
const DIR = join(process.cwd(), ".cache", "nascar");
const FILE = join(DIR, "cup_series.parquet");
const ETAG = join(DIR, "cup_series.etag");

/* Returns the Cup parquet as an ArrayBuffer (what hyparquet wants). */
export async function ensureCupParquet(log) {
  mkdirSync(DIR, { recursive: true });
  const headers = { "User-Agent": CONTACT };
  if (existsSync(FILE) && existsSync(ETAG)) headers["If-None-Match"] = readFileSync(ETAG, "utf8").trim();

  let res;
  try {
    res = await fetch(URL, { headers });
  } catch (err) {
    if (existsSync(FILE)) {
      log(`  ! nascaR.data fetch failed (${err.message}) — using cached parquet`);
      return toArrayBuffer(readFileSync(FILE));
    }
    throw err;
  }

  if (res.status === 304 && existsSync(FILE)) {
    log("NASCAR: cached parquet is current (304)");
    return toArrayBuffer(readFileSync(FILE));
  }
  if (!res.ok) {
    if (existsSync(FILE)) {
      log(`  ! nascaR.data HTTP ${res.status} — using cached parquet`);
      return toArrayBuffer(readFileSync(FILE));
    }
    throw new Error(`HTTP ${res.status} downloading ${URL}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(FILE, buf);
  const etag = res.headers.get("etag");
  if (etag) writeFileSync(ETAG, etag);
  log(`NASCAR: downloaded cup_series.parquet (${(buf.length / 1048576).toFixed(1)} MB)`);
  return toArrayBuffer(buf);
}

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
