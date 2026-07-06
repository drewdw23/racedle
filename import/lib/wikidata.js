/* Wikidata client — SPARQL for structured driver facts (CC0 data).
   Used to enrich each unique driver name found in season rosters with
   nationality, debut year, championship count, career wins, and
   active/retired status. */

import { getJSON } from "./http.js";

const SPARQL = "https://query.wikidata.org/sparql";

export async function sparql(query) {
  const url = `${SPARQL}?format=json&query=${encodeURIComponent(query)}`;
  const data = await getJSON(url);
  if (!data || data.__httpError) return [];
  return data.results.bindings;
}

const WD_API = "https://www.wikidata.org/w/api.php";

/* Resolve a driver name to a Wikidata entity. SPARQL label-matching is
   slow and misses accented/redirected names, so we use the search API
   (wbsearchentities) and pick the first candidate whose description
   looks motorsport-related, falling back to the top hit. */
export async function findDriver(name) {
  const url = `${WD_API}?${new URLSearchParams({
    action: "wbsearchentities", search: name, language: "en",
    type: "item", limit: "7", format: "json", origin: "*",
  })}`;
  const data = await getJSON(url);
  if (!data || data.__httpError || !data.search?.length) return null;

  const MOTOR = /(racing|driver|formula|nascar|rally|indycar|motorsport|racer)/i;
  const pick =
    data.search.find((c) => MOTOR.test(c.description || "")) || data.search[0];
  return { qid: pick.id, label: pick.label };
}

/* Pull enrichment facts for a resolved Wikidata entity, including the
   occupation list so the caller can drop non-drivers (crew chiefs,
   team owners, engineers) that leak in from irregular roster tables. */
export async function driverFacts(qid) {
  const q = `
    SELECT ?citizenLabel ?workStart ?workEnd (GROUP_CONCAT(DISTINCT ?ol; separator="|") AS ?occs) WHERE {
      OPTIONAL { wd:${qid} wdt:P27 ?c. ?c rdfs:label ?citizenLabel. FILTER(LANG(?citizenLabel)="en") }
      OPTIONAL { wd:${qid} wdt:P2031 ?workStart. }
      OPTIONAL { wd:${qid} wdt:P2032 ?workEnd. }
      OPTIONAL { wd:${qid} wdt:P106 ?o. ?o rdfs:label ?ol. FILTER(LANG(?ol)="en") }
    } GROUP BY ?citizenLabel ?workStart ?workEnd LIMIT 1`;
  const rows = await sparql(q);
  if (!rows.length) return { occupations: [] };
  const r = rows[0];
  return {
    citizenship: r.citizenLabel?.value || null,
    workStart: r.workStart ? Number(r.workStart.value.slice(0, 4)) : null,
    workEnd: r.workEnd ? Number(r.workEnd.value.slice(0, 4)) : null,
    occupations: r.occs?.value ? r.occs.value.split("|").filter(Boolean) : [],
  };
}

/* True if the occupation list marks a competition driver/racer;
   false if occupations are known but none are driving; null if unknown. */
export function occupationIsDriver(occupations) {
  if (!occupations || occupations.length === 0) return null;
  return occupations.some((o) => /\b(driver|racer|racing)\b/i.test(o));
}
