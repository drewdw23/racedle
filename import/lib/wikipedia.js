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

/* Parse tables into rectangular grids that honor rowspan/colspan, so a
   given column index means the same column on every row. This is what
   lets us reliably read the "Driver(s)" column even in NASCAR team
   tables where the Team/Manufacturer cells span several driver rows
   (the naive approach drifts onto the Crew chief column). */
export function parseTables(html) {
  const tables = [];
  const tableRe = /<table[\s\S]*?<\/table>/gi;
  let m;
  while ((m = tableRe.exec(html))) {
    const rawRows = [];
    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    let rm;
    while ((rm = rowRe.exec(m[0]))) {
      const cells = [];
      const cellRe = /<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi;
      let cm;
      while ((cm = cellRe.exec(rm[0]))) {
        cells.push({
          header: cm[1].toLowerCase() === "th",
          rowspan: attrNum(cm[2], "rowspan"),
          colspan: attrNum(cm[2], "colspan"),
          links: extractLinks(cm[3]),
          text: stripTags(cm[3]),
        });
      }
      if (cells.length) rawRows.push(cells);
    }
    const grid = expandSpans(rawRows);
    if (grid.length) tables.push(grid);
  }
  return tables;
}

function attrNum(attrs, name) {
  const m = new RegExp(`${name}\\s*=\\s*["']?(\\d+)`, "i").exec(attrs || "");
  return m ? Math.max(1, Number(m[1])) : 1;
}

/* Turn raw parsed rows (with span metadata) into a rectangular grid,
   carrying rowspanned cells down and duplicating colspanned cells. */
function expandSpans(rawRows) {
  const grid = [];
  const carry = []; // per-column: { cell, remaining }
  for (const raw of rawRows) {
    const out = [];
    let col = 0;
    let ri = 0;
    const nextFree = () => {
      while (carry[col] && carry[col].remaining > 0) {
        out[col] = carry[col].cell;
        carry[col].remaining -= 1;
        col++;
      }
    };
    while (ri < raw.length) {
      nextFree();
      const cell = raw[ri++];
      for (let c = 0; c < cell.colspan; c++) {
        out[col] = cell;
        if (cell.rowspan > 1) carry[col] = { cell, remaining: cell.rowspan - 1 };
        col++;
      }
    }
    nextFree(); // trailing carried cells
    grid.push(out.map((c) => c || { header: false, links: [], text: "" }));
  }
  return grid;
}

/* From a set of parsed tables, pull driver names out of the column(s)
   whose header text matches any of `driverColumns`. Falls back to any
   column that mostly contains links to person-like articles. */
export function driversFromTables(tables, driverColumns) {
  const wanted = driverColumns.map((c) => c.toLowerCase());
  const names = new Set();

  for (const rows of tables) {
    // The column-header block is the LEADING run of header rows (e.g. a
    // "Championship entries" super-header above the real "Team / Car /
    // Driver name" row). Sub-headers that appear mid-table (e.g. a
    // "Wildcard entries" separator) must NOT be treated as the header
    // block, or every driver above them gets skipped.
    const isHeaderRow = (r) => r.filter((c) => c.header).length >= r.length / 2;
    let headerBlockEnd = -1;
    while (headerBlockEnd + 1 < rows.length && isHeaderRow(rows[headerBlockEnd + 1])) headerBlockEnd++;
    if (headerBlockEnd < 0) continue;
    const headerRows = rows.slice(0, headerBlockEnd + 1);

    const width = Math.max(...rows.map((r) => r.length));
    const combined = [];
    for (let i = 0; i < width; i++) {
      combined[i] = headerRows.map((r) => (r[i] ? r[i].text.toLowerCase() : "")).join(" ").trim();
    }
    const colIdx = combined.findIndex((h) => wanted.some((w) => h === w || h.split(/\s+/).includes(w) || h.includes(w)));
    if (colIdx === -1) continue;

    for (let ri = headerBlockEnd + 1; ri < rows.length; ri++) {
      const cell = rows[ri][colIdx];
      if (!cell || cell.header) continue; // skip mid-table sub-header separators
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
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tm = /\btitle="([^"]+)"/i.exec(m[1]);
    if (!tm) continue;
    const t = decodeEntities(tm[1]);
    if (/[:#]/.test(t)) continue; // files, categories, footnotes
    // Skip flag/icon links: the anchor wraps only an <img>, so its
    // visible text is empty (this is how "United Kingdom" etc. leaked in).
    if (!stripTags(m[2]).trim()) continue;
    if (COUNTRY_STOP.has(t)) continue;
    out.push(t);
  }
  return out;
}

/* Belt-and-suspenders: nationalities that still slip through as text. */
const COUNTRY_STOP = new Set([
  "United Kingdom", "United States", "Australia", "New Zealand", "Germany", "France",
  "Italy", "Spain", "Brazil", "Finland", "Sweden", "Japan", "Canada", "Belgium",
  "Netherlands", "Austria", "Switzerland", "Argentina", "Mexico", "Denmark", "Norway",
  "Ireland", "Portugal", "Estonia", "Colombia", "Venezuela", "Russia", "Monaco",
  "South Africa", "Poland", "Czech Republic", "China", "Thailand", "India",
]);

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
