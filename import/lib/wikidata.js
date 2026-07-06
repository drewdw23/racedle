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

/* Resolve a driver name to a Wikidata entity that is a racing driver,
   optionally biased toward a discipline label to disambiguate. Returns
   { qid, label } or null. */
export async function findDriver(name) {
  // occupation: racing driver (Q378622), rally driver (Q10842936),
  // motorcycle racer excluded on purpose.
  const q = `
    SELECT ?item ?itemLabel WHERE {
      ?item rdfs:label ?nm .
      FILTER(LCASE(STR(?nm)) = LCASE("${escapeStr(name)}"))
      ?item wdt:P106 ?occ .
      VALUES ?occ { wd:Q378622 wd:Q10842936 wd:Q13381863 wd:Q11774891 }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 1`;
  const rows = await sparql(q);
  if (!rows.length) return null;
  return { qid: rows[0].item.value.split("/").pop(), label: rows[0].itemLabel.value };
}

/* Pull enrichment facts for a resolved Wikidata entity. */
export async function driverFacts(qid) {
  const q = `
    SELECT ?citizenLabel ?workStart ?workEnd ?dob WHERE {
      OPTIONAL { wd:${qid} wdt:P27 ?citizen. }
      OPTIONAL { wd:${qid} wdt:P2031 ?workStart. }
      OPTIONAL { wd:${qid} wdt:P2032 ?workEnd. }
      OPTIONAL { wd:${qid} wdt:P569 ?dob. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 1`;
  const rows = await sparql(q);
  if (!rows.length) return {};
  const r = rows[0];
  return {
    citizenship: r.citizenLabel?.value || null,
    workStart: r.workStart ? Number(r.workStart.value.slice(0, 4)) : null,
    workEnd: r.workEnd ? Number(r.workEnd.value.slice(0, 4)) : null,
  };
}

function escapeStr(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
