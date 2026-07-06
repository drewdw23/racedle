/* Wikipedia client (CC BY-SA content via the MediaWiki API).
   Fetches season articles and extracts driver names from the
   full-season entry-list table.

   HTML table parsing here is intentionally dependency-free and
   tolerant rather than a full DOM parse — Wikipedia's motorsport
   season tables are hand-authored and irregular, so we prefer linked
   article titles (<a title="...">) as the cleanest name signal and
   fall back to stripped cell text. See README "First-run tuning". */

import { getJSON, isHttpError } from "./http.js";

const API = "https://en.wikipedia.org/w/api.php";

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  return getJSON(url);
}

/* Returns the first title in `candidates` that resolves to a real
   article (following redirects), or null. */
export async function resolveTitle(candidates) {
  for (const title of candidates) {
    const data = await api({ action: "query", titles: title, redirects: "1" });
    if (isHttpError(data)) continue;
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (page && !("missing" in page)) return page.title;
  }
  return null;
}

export async function getSections(title) {
  const data = await api({ action: "parse", page: title, prop: "sections" });
  if (isHttpError(data) || !data?.parse) return [];
  return data.parse.sections.map((s) => ({ index: s.index, line: stripTags(s.line) }));
}

export async function getSectionHtml(title, index) {
  const data = await api({ action: "parse", page: title, prop: "text", section: String(index) });
  if (isHttpError(data) || !data?.parse) return "";
  return data.parse.text["*"] || "";
}

export async function getFullPageHtml(title) {
  const data = await api({ action: "parse", page: title, prop: "text" });
  if (isHttpError(data) || !data?.parse) return "";
  return data.parse.text["*"] || "";
}

/* ---------- HTML table extraction ---------- */

export function parseTables(html) {
  const tables = [];
  const tableRe = /<table[\s\S]*?<\/table>/gi;
  let m;
  while ((m = tableRe.exec(html))) {
    const table = m[0];
    const rows = [];
    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    let rm;
    while ((rm = rowRe.exec(table))) {
      const cells = [];
      const cellRe = /<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi;
      let cm;
      while ((cm = cellRe.exec(rm[0]))) {
        cells.push({
          header: cm[1].toLowerCase() === "th",
          links: extractLinks(cm[3]),
          text: stripTags(cm[3]),
        });
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

/* From a set of parsed tables, pull driver names out of the column(s)
   whose header text matches any of `driverColumns`. Falls back to any
   column that mostly contains links to person-like articles. */
export function driversFromTables(tables, driverColumns) {
  const wanted = driverColumns.map((c) => c.toLowerCase());
  const names = new Set();

  for (const rows of tables) {
    const headerRow = rows.find((r) => r.some((c) => c.header)) || rows[0];
    const headers = headerRow.map((c) => c.text.toLowerCase());
    const colIdx = headers.findIndex((h) => wanted.some((w) => h === w || h.includes(w)));
    if (colIdx === -1) continue;

    for (const row of rows) {
      if (row === headerRow) continue;
      const cell = row[colIdx];
      if (!cell) continue;
      // Prefer linked article titles (cleanest); else stripped text.
      const candidates = cell.links.length ? cell.links : [cell.text];
      for (const c of candidates) {
        const name = cleanName(c);
        if (isPlausibleName(name)) names.add(name);
      }
    }
  }
  return [...names];
}

function extractLinks(html) {
  const out = [];
  const re = /<a\b[^>]*?\btitle="([^"]+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const t = decodeEntities(m[1]);
    // skip non-article links (files, categories, footnotes, flags)
    if (/[:#]/.test(t)) continue;
    out.push(t);
  }
  return out;
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/* Wikipedia article titles sometimes carry a disambiguator, e.g.
   "Chris Amon (racing driver)" — drop it. */
function cleanName(s) {
  return s.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function isPlausibleName(s) {
  if (!s || s.length < 3 || s.length > 40) return false;
  if (/\d/.test(s)) return false;
  // at least two words (given + family), letters/marks/hyphens/apostrophes/periods
  if (!/^[\p{L}][\p{L}\p{M}.'-]*(?:\s+[\p{L}][\p{L}\p{M}.'-]*)+$/u.test(s)) return false;
  return true;
}
