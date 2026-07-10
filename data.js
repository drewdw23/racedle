/* ============================================================
   RACEDLE — Driver database
   ------------------------------------------------------------
   INCLUSION RULE: drivers who completed at least one full season
   (or were era-defining multi-season regulars) in one of:
   Formula 1, NASCAR Cup, IndyCar, CART/Champ Car, V8 Supercars,
   IMSA, WEC, WRC.

   TAXONOMY:
   - Each driver appears once, under their PRIMARY series (the
     series they are most associated with — judgment call for
     multi-series careers, e.g. Montoya -> F1, SVG -> NASCAR).
   - IndyCar = modern IndyCar Series + pre-1979 USAC careers.
     CART / Champ Car = drivers whose peak was 1979–2007 CART.
   - WEC includes pre-2012 World Sportscar Championship legends.
   - IMSA titles = top-class (GTP/DP/DPi/GTP) season championships,
     including the Grand-Am era.
   - "Championships" = top-class titles in the primary series.
   - "Debut" = first top-class start in the primary series.
   - Status: Active = full-time (or regular title-contending
     part-timer) in their primary series. Deceased = Retired.

   DATA VINTAGE (verify before public launch — see BUSINESS_PLAN.md):
   - Teams reflect 2025/2026 rosters; career stats generally
     through the END OF THE 2024 SEASON. 2025 outcomes are included
     only where certain (e.g. Palou's 2025 IndyCar title).
     Win counts only ever display as bands
     (0, 1-9, 10-24, 25-49, 50-99, 100+), which buffers staleness,
     but borderline drivers should be re-checked. Entries marked
     "verify" are the shakiest.
   ============================================================ */

const SERIES = {
  F1: "Formula 1",
  NASCAR: "NASCAR Cup",
  INDYCAR: "IndyCar",
  CART: "CART / Champ Car",
  SUPERCARS: "V8 Supercars",
  IMSA: "IMSA",
  WEC: "WEC",
  WRC: "WRC",
};

/* Playable genres. `series: null` means the full combined pool
   ("Ultimate"). Small single-series pools are grouped — IndyCar and
   CART/Champ Car share one lineage, and IMSA + WEC are both endurance
   sportscar racing — so every genre has a big enough answer pool for
   a fun daily rotation. The Series tile still distinguishes the exact
   series within a genre. */
const GENRES = [
  { id: "ultimate",  label: "Ultimate",     series: null },
  { id: "f1",        label: "Formula 1",    series: [SERIES.F1] },
  { id: "nascar",    label: "NASCAR",       series: [SERIES.NASCAR] },
  { id: "indycar",   label: "IndyCar",      series: [SERIES.INDYCAR, SERIES.CART] },
  { id: "supercars", label: "V8 Supercars", series: [SERIES.SUPERCARS] },
  { id: "endurance", label: "Endurance",    series: [SERIES.IMSA, SERIES.WEC] },
  { id: "rally",     label: "Rally",        series: [SERIES.WRC] },
];

const FLAGS = {
  "Argentina": "🇦🇷", "Australia": "🇦🇺", "Austria": "🇦🇹", "Belgium": "🇧🇪",
  "Brazil": "🇧🇷", "Canada": "🇨🇦", "China": "🇨🇳", "Colombia": "🇨🇴",
  "Denmark": "🇩🇰", "Estonia": "🇪🇪", "Finland": "🇫🇮", "France": "🇫🇷",
  "Germany": "🇩🇪", "Ireland": "🇮🇪", "Italy": "🇮🇹", "Japan": "🇯🇵",
  "Mexico": "🇲🇽", "Monaco": "🇲🇨", "Netherlands": "🇳🇱", "New Zealand": "🇳🇿",
  "Norway": "🇳🇴", "Portugal": "🇵🇹", "Russia": "🇷🇺", "South Africa": "🇿🇦",
  "Spain": "🇪🇸", "Sweden": "🇸🇪", "Switzerland": "🇨🇭", "Thailand": "🇹🇭",
  "United Kingdom": "🇬🇧", "United States": "🇺🇸", "Venezuela": "🇻🇪",
  "Malaysia": "🇲🇾", "Chile": "🇨🇱", "Zimbabwe": "🇿🇼", "India": "🇮🇳", "Liechtenstein": "🇱🇮", "Indonesia": "🇮🇩", "Poland": "🇵🇱", "Czech Republic": "🇨🇿", "Hungary": "🇭🇺",
};

/* name, country, continent, series, team (current/last), titles,
   wins (career, used only to derive the band), status, debut year */
const DRIVERS = [
  // ================= FORMULA 1 =================
  // Generated from F1DB (f1db v2026.9.1, CC BY 4.0 — attribution required, see site footer) on 2026-07-10.
  // Pool = drivers who started >= 60% of a season's rounds (held to date) in some
  // season >= 1970. Regenerate: cd import && node run.js --series=f1 && node merge-f1.js
  { name: "Adrián Campos", country: "Spain", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Adrian Sutil", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 2007 },
  { name: "Aguri Suzuki", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Ligier", titles: 0, wins: 0, status: "Retired", debut: 1988 },
  { name: "Alain Prost", country: "France", continent: "Europe", series: SERIES.F1, team: "Williams", titles: 4, wins: 51, status: "Retired", debut: 1980 },
  { name: "Alan Jones", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "Lola", titles: 1, wins: 12, status: "Retired", debut: 1975 },
  { name: "Alessandro Nannini", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Benetton", titles: 0, wins: 1, status: "Retired", debut: 1986 },
  { name: "Alex Caffi", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Andrea Moda", titles: 0, wins: 0, status: "Retired", debut: 1986 },
  { name: "Alex Yoong", country: "Malaysia", continent: "Asia", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 2001 },
  { name: "Alexander Albon", country: "Thailand", continent: "Asia", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Active", debut: 2019 },
  { name: "Alexander Wurz", country: "Austria", continent: "Europe", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 1997 },
  { name: "Andrea de Adamich", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Brabham", titles: 0, wins: 0, status: "Retired", debut: 1968 },
  { name: "Andrea de Cesaris", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 1980 },
  { name: "Andrea Montermini", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Forti", titles: 0, wins: 0, status: "Retired", debut: 1995 },
  { name: "Antonio Giovinazzi", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Alfa Romeo", titles: 0, wins: 0, status: "Retired", debut: 2017 },
  { name: "Antônio Pizzonia", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 2003 },
  { name: "Arturo Merzario", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Merzario", titles: 0, wins: 0, status: "Retired", debut: 1972 },
  { name: "Arvid Lindblad", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Racing Bulls", titles: 0, wins: 0, status: "Active", debut: 2026 },
  { name: "Ayrton Senna", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Williams", titles: 3, wins: 41, status: "Retired", debut: 1984 },
  { name: "Bertrand Gachot", country: "France", continent: "Europe", series: SERIES.F1, team: "Pacific", titles: 0, wins: 0, status: "Retired", debut: 1989 },
  { name: "Brett Lunger", country: "United States", continent: "North America", series: SERIES.F1, team: "Ensign", titles: 0, wins: 0, status: "Retired", debut: 1975 },
  { name: "Brian Henton", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Tyrrell", titles: 0, wins: 0, status: "Retired", debut: 1975 },
  { name: "Bruno Giacomelli", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Life", titles: 0, wins: 0, status: "Retired", debut: 1977 },
  { name: "Bruno Senna", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 2010 },
  { name: "Carlos Pace", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Brabham", titles: 0, wins: 1, status: "Retired", debut: 1972 },
  { name: "Carlos Reutemann", country: "Argentina", continent: "South America", series: SERIES.F1, team: "Williams", titles: 0, wins: 12, status: "Retired", debut: 1972 },
  { name: "Carlos Sainz Jr.", country: "Spain", continent: "Europe", series: SERIES.F1, team: "Williams", titles: 0, wins: 4, status: "Active", debut: 2015 },
  { name: "Charles Leclerc", country: "Monaco", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 0, wins: 9, status: "Active", debut: 2018 },
  { name: "Charles Pic", country: "France", continent: "Europe", series: SERIES.F1, team: "Caterham", titles: 0, wins: 0, status: "Retired", debut: 2012 },
  { name: "Chris Amon", country: "New Zealand", continent: "Oceania", series: SERIES.F1, team: "Wolf-Williams", titles: 0, wins: 0, status: "Retired", debut: 1963 },
  { name: "Christian Danner", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Rial", titles: 0, wins: 0, status: "Retired", debut: 1985 },
  { name: "Christian Fittipaldi", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Footwork", titles: 0, wins: 0, status: "Retired", debut: 1992 },
  { name: "Christian Klien", country: "Austria", continent: "Europe", series: SERIES.F1, team: "HRT", titles: 0, wins: 0, status: "Retired", debut: 2004 },
  { name: "Christijan Albers", country: "Netherlands", continent: "Europe", series: SERIES.F1, team: "Spyker", titles: 0, wins: 0, status: "Retired", debut: 2005 },
  { name: "Clay Regazzoni", country: "Switzerland", continent: "Europe", series: SERIES.F1, team: "Ensign", titles: 0, wins: 5, status: "Retired", debut: 1970 },
  { name: "Corrado Fabi", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Brabham", titles: 0, wins: 0, status: "Retired", debut: 1983 },
  { name: "Damon Hill", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 1, wins: 22, status: "Retired", debut: 1992 },
  { name: "Daniel Ricciardo", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "RB", titles: 0, wins: 8, status: "Retired", debut: 2011 },
  { name: "Daniil Kvyat", country: "Russia", continent: "Europe", series: SERIES.F1, team: "AlphaTauri", titles: 0, wins: 0, status: "Retired", debut: 2014 },
  { name: "David Brabham", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "Simtek", titles: 0, wins: 0, status: "Retired", debut: 1990 },
  { name: "David Coulthard", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Red Bull", titles: 0, wins: 13, status: "Retired", debut: 1994 },
  { name: "David Walker", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "Lotus", titles: 0, wins: 0, status: "Retired", debut: 1971 },
  { name: "Denny Hulme", country: "New Zealand", continent: "Oceania", series: SERIES.F1, team: "McLaren", titles: 1, wins: 8, status: "Retired", debut: 1965 },
  { name: "Derek Daly", country: "Ireland", continent: "Europe", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 1978 },
  { name: "Derek Warwick", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Footwork", titles: 0, wins: 0, status: "Retired", debut: 1981 },
  { name: "Didier Pironi", country: "France", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 0, wins: 3, status: "Retired", debut: 1978 },
  { name: "Eddie Cheever", country: "United States", continent: "North America", series: SERIES.F1, team: "Arrows", titles: 0, wins: 0, status: "Retired", debut: 1978 },
  { name: "Eddie Irvine", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Jaguar", titles: 0, wins: 4, status: "Retired", debut: 1993 },
  { name: "Elio de Angelis", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Brabham", titles: 0, wins: 2, status: "Retired", debut: 1979 },
  { name: "Eliseo Salazar", country: "Chile", continent: "South America", series: SERIES.F1, team: "RAM", titles: 0, wins: 0, status: "Retired", debut: 1981 },
  { name: "Emanuele Pirro", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Dallara", titles: 0, wins: 0, status: "Retired", debut: 1989 },
  { name: "Emerson Fittipaldi", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Fittipaldi", titles: 2, wins: 14, status: "Retired", debut: 1970 },
  { name: "Enrique Bernoldi", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Arrows", titles: 0, wins: 0, status: "Retired", debut: 2001 },
  { name: "Éric Bernard", country: "France", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 0, wins: 0, status: "Retired", debut: 1989 },
  { name: "Érik Comas", country: "France", continent: "Europe", series: SERIES.F1, team: "Larrousse", titles: 0, wins: 0, status: "Retired", debut: 1991 },
  { name: "Esteban Gutiérrez", country: "Mexico", continent: "North America", series: SERIES.F1, team: "Haas", titles: 0, wins: 0, status: "Retired", debut: 2013 },
  { name: "Esteban Ocon", country: "France", continent: "Europe", series: SERIES.F1, team: "Haas", titles: 0, wins: 1, status: "Active", debut: 2016 },
  { name: "Esteban Tuero", country: "Argentina", continent: "South America", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1998 },
  { name: "Felipe Massa", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Williams", titles: 0, wins: 11, status: "Retired", debut: 2002 },
  { name: "Fernando Alonso", country: "Spain", continent: "Europe", series: SERIES.F1, team: "Aston Martin", titles: 2, wins: 32, status: "Active", debut: 2001 },
  { name: "Franco Colapinto", country: "Argentina", continent: "South America", series: SERIES.F1, team: "Alpine", titles: 0, wins: 0, status: "Active", debut: 2024 },
  { name: "François Cevert", country: "France", continent: "Europe", series: SERIES.F1, team: "Tyrrell", titles: 0, wins: 1, status: "Retired", debut: 1969 },
  { name: "François Hesnault", country: "France", continent: "Europe", series: SERIES.F1, team: "Renault", titles: 0, wins: 0, status: "Retired", debut: 1984 },
  { name: "François Migault", country: "France", continent: "Europe", series: SERIES.F1, team: "Frank Williams Racing Cars", titles: 0, wins: 0, status: "Retired", debut: 1972 },
  { name: "Gabriel Bortoleto", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Audi", titles: 0, wins: 0, status: "Active", debut: 2025 },
  { name: "Gabriele Tarquini", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Tyrrell", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Gastón Mazzacane", country: "Argentina", continent: "South America", series: SERIES.F1, team: "Prost", titles: 0, wins: 0, status: "Retired", debut: 2000 },
  { name: "George Eaton", country: "Canada", continent: "North America", series: SERIES.F1, team: "BRM", titles: 0, wins: 0, status: "Retired", debut: 1969 },
  { name: "George Follmer", country: "United States", continent: "North America", series: SERIES.F1, team: "Shadow", titles: 0, wins: 0, status: "Retired", debut: 1973 },
  { name: "George Russell", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Mercedes", titles: 0, wins: 7, status: "Active", debut: 2019 },
  { name: "Gerhard Berger", country: "Austria", continent: "Europe", series: SERIES.F1, team: "Benetton", titles: 0, wins: 10, status: "Retired", debut: 1984 },
  { name: "Giancarlo Fisichella", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 0, wins: 3, status: "Retired", debut: 1996 },
  { name: "Gianmaria Bruni", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 2004 },
  { name: "Gianni Morbidelli", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 1990 },
  { name: "Giedo van der Garde", country: "Netherlands", continent: "Europe", series: SERIES.F1, team: "Caterham", titles: 0, wins: 0, status: "Retired", debut: 2013 },
  { name: "Gilles Villeneuve", country: "Canada", continent: "North America", series: SERIES.F1, team: "Ferrari", titles: 0, wins: 6, status: "Retired", debut: 1977 },
  { name: "Giorgio Pantano", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 0, wins: 0, status: "Retired", debut: 2004 },
  { name: "Graham Hill", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Hill", titles: 2, wins: 14, status: "Retired", debut: 1958 },
  { name: "Guanyu Zhou", country: "China", continent: "Asia", series: SERIES.F1, team: "Kick Sauber", titles: 0, wins: 0, status: "Retired", debut: 2022 },
  { name: "Gunnar Nilsson", country: "Sweden", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 0, wins: 1, status: "Retired", debut: 1976 },
  { name: "Hans Binder", country: "Austria", continent: "Europe", series: SERIES.F1, team: "ATS", titles: 0, wins: 0, status: "Retired", debut: 1976 },
  { name: "Hans-Joachim Stuck", country: "Germany", continent: "Europe", series: SERIES.F1, team: "ATS", titles: 0, wins: 0, status: "Retired", debut: 1974 },
  { name: "Harald Ertl", country: "Austria", continent: "Europe", series: SERIES.F1, team: "ATS", titles: 0, wins: 0, status: "Retired", debut: 1975 },
  { name: "Héctor Rebaque", country: "Mexico", continent: "North America", series: SERIES.F1, team: "Brabham", titles: 0, wins: 0, status: "Retired", debut: 1977 },
  { name: "Heikki Kovalainen", country: "Finland", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 0, wins: 1, status: "Retired", debut: 2007 },
  { name: "Heinz-Harald Frentzen", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 3, status: "Retired", debut: 1994 },
  { name: "Henri Pescarolo", country: "France", continent: "Europe", series: SERIES.F1, team: "Surtees", titles: 0, wins: 0, status: "Retired", debut: 1968 },
  { name: "Howden Ganley", country: "New Zealand", continent: "Oceania", series: SERIES.F1, team: "Maki", titles: 0, wins: 0, status: "Retired", debut: 1971 },
  { name: "Huub Rothengatter", country: "Netherlands", continent: "Europe", series: SERIES.F1, team: "Zakspeed", titles: 0, wins: 0, status: "Retired", debut: 1984 },
  { name: "Ian Scheckter", country: "South Africa", continent: "Africa", series: SERIES.F1, team: "March", titles: 0, wins: 0, status: "Retired", debut: 1974 },
  { name: "Isack Hadjar", country: "France", continent: "Europe", series: SERIES.F1, team: "Red Bull", titles: 0, wins: 0, status: "Active", debut: 2025 },
  { name: "Ivan Capelli", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 0, wins: 0, status: "Retired", debut: 1985 },
  { name: "Jack Brabham", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "Brabham", titles: 3, wins: 14, status: "Retired", debut: 1955 },
  { name: "Jackie Oliver", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Shadow", titles: 0, wins: 0, status: "Retired", debut: 1967 },
  { name: "Jackie Stewart", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Tyrrell", titles: 3, wins: 27, status: "Retired", debut: 1965 },
  { name: "Jacky Ickx", country: "Belgium", continent: "Europe", series: SERIES.F1, team: "Ligier", titles: 0, wins: 8, status: "Retired", debut: 1966 },
  { name: "Jacques Laffite", country: "France", continent: "Europe", series: SERIES.F1, team: "Ligier", titles: 0, wins: 6, status: "Retired", debut: 1974 },
  { name: "Jacques Villeneuve", country: "Canada", continent: "North America", series: SERIES.F1, team: "BMW Sauber", titles: 1, wins: 11, status: "Retired", debut: 1996 },
  { name: "Jaime Alguersuari", country: "Spain", continent: "Europe", series: SERIES.F1, team: "Toro Rosso", titles: 0, wins: 0, status: "Retired", debut: 2009 },
  { name: "James Hunt", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Wolf", titles: 1, wins: 10, status: "Retired", debut: 1973 },
  { name: "Jan Lammers", country: "Netherlands", continent: "Europe", series: SERIES.F1, team: "March", titles: 0, wins: 0, status: "Retired", debut: 1979 },
  { name: "Jan Magnussen", country: "Denmark", continent: "Europe", series: SERIES.F1, team: "Stewart", titles: 0, wins: 0, status: "Retired", debut: 1995 },
  { name: "Jarno Trulli", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Lotus Racing", titles: 0, wins: 1, status: "Retired", debut: 1997 },
  { name: "Jean Alesi", country: "France", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 0, wins: 1, status: "Retired", debut: 1989 },
  { name: "Jean-Christophe Boullion", country: "France", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 1995 },
  { name: "Jean-Éric Vergne", country: "France", continent: "Europe", series: SERIES.F1, team: "Toro Rosso", titles: 0, wins: 0, status: "Retired", debut: 2012 },
  { name: "Jean-Pierre Beltoise", country: "France", continent: "Europe", series: SERIES.F1, team: "BRM", titles: 0, wins: 1, status: "Retired", debut: 1966 },
  { name: "Jean-Pierre Jabouille", country: "France", continent: "Europe", series: SERIES.F1, team: "Ligier", titles: 0, wins: 2, status: "Retired", debut: 1975 },
  { name: "Jean-Pierre Jarier", country: "France", continent: "Europe", series: SERIES.F1, team: "Ligier", titles: 0, wins: 0, status: "Retired", debut: 1971 },
  { name: "Jenson Button", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 1, wins: 15, status: "Retired", debut: 2000 },
  { name: "Jérôme d'Ambrosio", country: "Belgium", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 0, wins: 0, status: "Retired", debut: 2011 },
  { name: "JJ Lehto", country: "Finland", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 1989 },
  { name: "Jo Siffert", country: "Switzerland", continent: "Europe", series: SERIES.F1, team: "BRM", titles: 0, wins: 2, status: "Retired", debut: 1962 },
  { name: "Jochen Mass", country: "Germany", continent: "Europe", series: SERIES.F1, team: "March", titles: 0, wins: 1, status: "Retired", debut: 1973 },
  { name: "Jochen Rindt", country: "Austria", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 1, wins: 6, status: "Retired", debut: 1964 },
  { name: "Jody Scheckter", country: "South Africa", continent: "Africa", series: SERIES.F1, team: "Ferrari", titles: 1, wins: 10, status: "Retired", debut: 1972 },
  { name: "John Surtees", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Surtees", titles: 1, wins: 6, status: "Retired", debut: 1960 },
  { name: "John Watson", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 0, wins: 5, status: "Retired", debut: 1973 },
  { name: "Johnny Cecotto", country: "Venezuela", continent: "South America", series: SERIES.F1, team: "Toleman", titles: 0, wins: 0, status: "Retired", debut: 1983 },
  { name: "Johnny Dumfries", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 0, wins: 0, status: "Retired", debut: 1986 },
  { name: "Johnny Herbert", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Jaguar", titles: 0, wins: 3, status: "Retired", debut: 1989 },
  { name: "Jolyon Palmer", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Renault", titles: 0, wins: 0, status: "Retired", debut: 2016 },
  { name: "Jonathan Palmer", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Tyrrell", titles: 0, wins: 0, status: "Retired", debut: 1983 },
  { name: "Jos Verstappen", country: "Netherlands", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1994 },
  { name: "Juan Pablo Montoya", country: "Colombia", continent: "South America", series: SERIES.F1, team: "McLaren", titles: 0, wins: 7, status: "Retired", debut: 2001 },
  { name: "Jules Bianchi", country: "France", continent: "Europe", series: SERIES.F1, team: "Marussia", titles: 0, wins: 0, status: "Retired", debut: 2013 },
  { name: "Karl Wendlinger", country: "Austria", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 1991 },
  { name: "Kazuki Nakajima", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 2007 },
  { name: "Keke Rosberg", country: "Finland", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 1, wins: 5, status: "Retired", debut: 1978 },
  { name: "Kevin Magnussen", country: "Denmark", continent: "Europe", series: SERIES.F1, team: "Haas", titles: 0, wins: 0, status: "Retired", debut: 2014 },
  { name: "Kimi Antonelli", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Mercedes", titles: 0, wins: 5, status: "Active", debut: 2025 },
  { name: "Kimi Räikkönen", country: "Finland", continent: "Europe", series: SERIES.F1, team: "Alfa Romeo", titles: 1, wins: 21, status: "Retired", debut: 2001 },
  { name: "Lance Stroll", country: "Canada", continent: "North America", series: SERIES.F1, team: "Aston Martin", titles: 0, wins: 0, status: "Active", debut: 2017 },
  { name: "Lando Norris", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 1, wins: 11, status: "Active", debut: 2019 },
  { name: "Lella Lombardi", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Brabham", titles: 0, wins: 0, status: "Retired", debut: 1975 },
  { name: "Lewis Hamilton", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 7, wins: 106, status: "Active", debut: 2007 },
  { name: "Liam Lawson", country: "New Zealand", continent: "Oceania", series: SERIES.F1, team: "Racing Bulls", titles: 0, wins: 0, status: "Active", debut: 2023 },
  { name: "Logan Sargeant", country: "United States", continent: "North America", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 2023 },
  { name: "Luca Badoer", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 0, wins: 0, status: "Retired", debut: 1993 },
  { name: "Lucas di Grassi", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Virgin", titles: 0, wins: 0, status: "Retired", debut: 2010 },
  { name: "Luciano Burti", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Prost", titles: 0, wins: 0, status: "Retired", debut: 2000 },
  { name: "Luis Pérez-Sala", country: "Spain", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1988 },
  { name: "Manfred Winkelhock", country: "Germany", continent: "Europe", series: SERIES.F1, team: "RAM", titles: 0, wins: 0, status: "Retired", debut: 1982 },
  { name: "Marc Gené", country: "Spain", continent: "Europe", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 1999 },
  { name: "Marc Surer", country: "Switzerland", continent: "Europe", series: SERIES.F1, team: "Arrows", titles: 0, wins: 0, status: "Retired", debut: 1979 },
  { name: "Mark Blundell", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 0, wins: 0, status: "Retired", debut: 1991 },
  { name: "Mark Donohue", country: "United States", continent: "North America", series: SERIES.F1, team: "March", titles: 0, wins: 0, status: "Retired", debut: 1971 },
  { name: "Mark Webber", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "Red Bull", titles: 0, wins: 9, status: "Retired", debut: 2002 },
  { name: "Martin Brundle", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 0, wins: 0, status: "Retired", debut: 1984 },
  { name: "Martin Donnelly", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 0, wins: 0, status: "Retired", debut: 1989 },
  { name: "Maurício Gugelmin", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Jordan", titles: 0, wins: 0, status: "Retired", debut: 1988 },
  { name: "Mauro Baldi", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Spirit", titles: 0, wins: 0, status: "Retired", debut: 1982 },
  { name: "Max Chilton", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Marussia", titles: 0, wins: 0, status: "Retired", debut: 2013 },
  { name: "Max Verstappen", country: "Netherlands", continent: "Europe", series: SERIES.F1, team: "Red Bull", titles: 4, wins: 71, status: "Active", debut: 2015 },
  { name: "Michael Schumacher", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Mercedes", titles: 7, wins: 91, status: "Retired", debut: 1991 },
  { name: "Michele Alboreto", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 5, status: "Retired", debut: 1981 },
  { name: "Mick Schumacher", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Haas", titles: 0, wins: 0, status: "Retired", debut: 2021 },
  { name: "Mika Häkkinen", country: "Finland", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 2, wins: 20, status: "Retired", debut: 1991 },
  { name: "Mika Salo", country: "Finland", continent: "Europe", series: SERIES.F1, team: "Toyota", titles: 0, wins: 0, status: "Retired", debut: 1994 },
  { name: "Mike Beuttler", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "March", titles: 0, wins: 0, status: "Retired", debut: 1971 },
  { name: "Mike Hailwood", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 0, wins: 0, status: "Retired", debut: 1963 },
  { name: "Nanni Galli", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Iso-Marlboro", titles: 0, wins: 0, status: "Retired", debut: 1971 },
  { name: "Narain Karthikeyan", country: "India", continent: "Asia", series: SERIES.F1, team: "HRT", titles: 0, wins: 0, status: "Retired", debut: 2005 },
  { name: "Nelson Piquet", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Benetton", titles: 3, wins: 23, status: "Retired", debut: 1978 },
  { name: "Nelson Piquet Jr.", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Renault", titles: 0, wins: 0, status: "Retired", debut: 2008 },
  { name: "Nicholas Latifi", country: "Canada", continent: "North America", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 2020 },
  { name: "Nick Heidfeld", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Renault", titles: 0, wins: 0, status: "Retired", debut: 2000 },
  { name: "Nico Hülkenberg", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Audi", titles: 0, wins: 0, status: "Active", debut: 2010 },
  { name: "Nico Rosberg", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Mercedes", titles: 1, wins: 23, status: "Retired", debut: 2006 },
  { name: "Nicola Larini", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Nigel Mansell", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 1, wins: 31, status: "Retired", debut: 1980 },
  { name: "Niki Lauda", country: "Austria", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 3, wins: 25, status: "Retired", debut: 1971 },
  { name: "Nikita Mazepin", country: "Russia", continent: "Europe", series: SERIES.F1, team: "Haas", titles: 0, wins: 0, status: "Retired", debut: 2021 },
  { name: "Oliver Bearman", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Haas", titles: 0, wins: 0, status: "Active", debut: 2024 },
  { name: "Olivier Beretta", country: "Monaco", continent: "Europe", series: SERIES.F1, team: "Larrousse", titles: 0, wins: 0, status: "Retired", debut: 1994 },
  { name: "Olivier Grouillard", country: "France", continent: "Europe", series: SERIES.F1, team: "Tyrrell", titles: 0, wins: 0, status: "Retired", debut: 1989 },
  { name: "Olivier Panis", country: "France", continent: "Europe", series: SERIES.F1, team: "Toyota", titles: 0, wins: 1, status: "Retired", debut: 1994 },
  { name: "Oscar Piastri", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "McLaren", titles: 0, wins: 9, status: "Active", debut: 2023 },
  { name: "Pascal Fabre", country: "France", continent: "Europe", series: SERIES.F1, team: "AGS", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Pascal Wehrlein", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 2016 },
  { name: "Pastor Maldonado", country: "Venezuela", continent: "South America", series: SERIES.F1, team: "Lotus", titles: 0, wins: 1, status: "Retired", debut: 2011 },
  { name: "Patrick Depailler", country: "France", continent: "Europe", series: SERIES.F1, team: "Alfa Romeo", titles: 0, wins: 2, status: "Retired", debut: 1972 },
  { name: "Patrick Tambay", country: "France", continent: "Europe", series: SERIES.F1, team: "Lola", titles: 0, wins: 2, status: "Retired", debut: 1977 },
  { name: "Paul di Resta", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 2011 },
  { name: "Pedro de la Rosa", country: "Spain", continent: "Europe", series: SERIES.F1, team: "HRT", titles: 0, wins: 0, status: "Retired", debut: 1999 },
  { name: "Pedro Diniz", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Sauber", titles: 0, wins: 0, status: "Retired", debut: 1995 },
  { name: "Pedro Lamy", country: "Portugal", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1993 },
  { name: "Pedro Rodríguez", country: "Mexico", continent: "North America", series: SERIES.F1, team: "BRM", titles: 0, wins: 2, status: "Retired", debut: 1963 },
  { name: "Peter Gethin", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Lola", titles: 0, wins: 1, status: "Retired", debut: 1970 },
  { name: "Peter Revson", country: "United States", continent: "North America", series: SERIES.F1, team: "Shadow", titles: 0, wins: 2, status: "Retired", debut: 1964 },
  { name: "Philippe Alliot", country: "France", continent: "Europe", series: SERIES.F1, team: "Larrousse", titles: 0, wins: 0, status: "Retired", debut: 1984 },
  { name: "Philippe Streiff", country: "France", continent: "Europe", series: SERIES.F1, team: "AGS", titles: 0, wins: 0, status: "Retired", debut: 1984 },
  { name: "Piercarlo Ghinzani", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Osella", titles: 0, wins: 0, status: "Retired", debut: 1981 },
  { name: "Pierluigi Martini", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1985 },
  { name: "Pierre Gasly", country: "France", continent: "Europe", series: SERIES.F1, team: "Alpine", titles: 0, wins: 1, status: "Active", debut: 2017 },
  { name: "Ralf Schumacher", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Toyota", titles: 0, wins: 6, status: "Retired", debut: 1997 },
  { name: "Ralph Firman", country: "Ireland", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 0, wins: 0, status: "Retired", debut: 2003 },
  { name: "Raul Boesel", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Ligier", titles: 0, wins: 0, status: "Retired", debut: 1982 },
  { name: "Reine Wisell", country: "Sweden", continent: "Europe", series: SERIES.F1, team: "March", titles: 0, wins: 0, status: "Retired", debut: 1970 },
  { name: "René Arnoux", country: "France", continent: "Europe", series: SERIES.F1, team: "Ligier", titles: 0, wins: 7, status: "Retired", debut: 1978 },
  { name: "Ricardo Rosset", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Tyrrell", titles: 0, wins: 0, status: "Retired", debut: 1996 },
  { name: "Ricardo Zonta", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Toyota", titles: 0, wins: 0, status: "Retired", debut: 1999 },
  { name: "Riccardo Patrese", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Benetton", titles: 0, wins: 6, status: "Retired", debut: 1977 },
  { name: "Robert Kubica", country: "Poland", continent: "Europe", series: SERIES.F1, team: "Alfa Romeo", titles: 0, wins: 1, status: "Retired", debut: 2006 },
  { name: "Roberto Guerrero", country: "Colombia", continent: "South America", series: SERIES.F1, team: "Theodore", titles: 0, wins: 0, status: "Retired", debut: 1982 },
  { name: "Roberto Merhi", country: "Spain", continent: "Europe", series: SERIES.F1, team: "Marussia", titles: 0, wins: 0, status: "Retired", debut: 2015 },
  { name: "Roberto Moreno", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Forti", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Rolf Stommelen", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Arrows", titles: 0, wins: 0, status: "Retired", debut: 1969 },
  { name: "Romain Grosjean", country: "France", continent: "Europe", series: SERIES.F1, team: "Haas", titles: 0, wins: 0, status: "Retired", debut: 2009 },
  { name: "Ronnie Peterson", country: "Sweden", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 0, wins: 10, status: "Retired", debut: 1970 },
  { name: "Rubens Barrichello", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Williams", titles: 0, wins: 11, status: "Retired", debut: 1993 },
  { name: "Rupert Keegan", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "March", titles: 0, wins: 0, status: "Retired", debut: 1977 },
  { name: "Satoru Nakajima", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Tyrrell", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Scott Speed", country: "United States", continent: "North America", series: SERIES.F1, team: "Toro Rosso", titles: 0, wins: 0, status: "Retired", debut: 2006 },
  { name: "Sebastian Vettel", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Aston Martin", titles: 4, wins: 53, status: "Retired", debut: 2007 },
  { name: "Sergey Sirotkin", country: "Russia", continent: "Europe", series: SERIES.F1, team: "Williams", titles: 0, wins: 0, status: "Retired", debut: 2018 },
  { name: "Sergio Pérez", country: "Mexico", continent: "North America", series: SERIES.F1, team: "Cadillac", titles: 0, wins: 6, status: "Active", debut: 2011 },
  { name: "Shinji Nakano", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1997 },
  { name: "Siegfried Stohr", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Arrows", titles: 0, wins: 0, status: "Retired", debut: 1981 },
  { name: "Stefan Johansson", country: "Sweden", continent: "Europe", series: SERIES.F1, team: "Footwork", titles: 0, wins: 0, status: "Retired", debut: 1983 },
  { name: "Stefano Modena", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Stoffel Vandoorne", country: "Belgium", continent: "Europe", series: SERIES.F1, team: "McLaren", titles: 0, wins: 0, status: "Retired", debut: 2016 },
  { name: "Taki Inoue", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Footwork", titles: 0, wins: 0, status: "Retired", debut: 1994 },
  { name: "Tarso Marques", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1996 },
  { name: "Teo Fabi", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Benetton", titles: 0, wins: 0, status: "Retired", debut: 1982 },
  { name: "Thierry Boutsen", country: "Belgium", continent: "Europe", series: SERIES.F1, team: "Jordan", titles: 0, wins: 3, status: "Retired", debut: 1983 },
  { name: "Tiago Monteiro", country: "Portugal", continent: "Europe", series: SERIES.F1, team: "Midland", titles: 0, wins: 0, status: "Retired", debut: 2005 },
  { name: "Tim Schenken", country: "Australia", continent: "Oceania", series: SERIES.F1, team: "Lotus", titles: 0, wins: 0, status: "Retired", debut: 1970 },
  { name: "Timo Glock", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Marussia", titles: 0, wins: 0, status: "Retired", debut: 2004 },
  { name: "Tom Pryce", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Shadow", titles: 0, wins: 0, status: "Retired", debut: 1974 },
  { name: "Tony Brise", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Hill", titles: 0, wins: 0, status: "Retired", debut: 1975 },
  { name: "Toranosuke Takagi", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Arrows", titles: 0, wins: 0, status: "Retired", debut: 1998 },
  { name: "Ukyo Katayama", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 1992 },
  { name: "Valtteri Bottas", country: "Finland", continent: "Europe", series: SERIES.F1, team: "Cadillac", titles: 0, wins: 10, status: "Active", debut: 2013 },
  { name: "Vitaly Petrov", country: "Russia", continent: "Europe", series: SERIES.F1, team: "Caterham", titles: 0, wins: 0, status: "Retired", debut: 2010 },
  { name: "Vitantonio Liuzzi", country: "Italy", continent: "Europe", series: SERIES.F1, team: "HRT", titles: 0, wins: 0, status: "Retired", debut: 2005 },
  { name: "Vittorio Brambilla", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Alfa Romeo", titles: 0, wins: 1, status: "Retired", debut: 1974 },
  { name: "Will Stevens", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Marussia", titles: 0, wins: 0, status: "Retired", debut: 2014 },
  { name: "Wilson Fittipaldi", country: "Brazil", continent: "South America", series: SERIES.F1, team: "Fittipaldi", titles: 0, wins: 0, status: "Retired", debut: 1972 },
  { name: "Yannick Dalmas", country: "France", continent: "Europe", series: SERIES.F1, team: "Larrousse", titles: 0, wins: 0, status: "Retired", debut: 1987 },
  { name: "Yuki Tsunoda", country: "Japan", continent: "Asia", series: SERIES.F1, team: "Red Bull", titles: 0, wins: 0, status: "Active", debut: 2021 },
  { name: "Zsolt Baumgartner", country: "Hungary", continent: "Europe", series: SERIES.F1, team: "Minardi", titles: 0, wins: 0, status: "Retired", debut: 2003 },

  // Pre-1970 F1 champions kept by hand (outside the import's 1970+ scope):
  { name: "Jim Clark", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Lotus", titles: 2, wins: 25, status: "Retired", debut: 1960 },
  { name: "Juan Manuel Fangio", country: "Argentina", continent: "South America", series: SERIES.F1, team: "Maserati", titles: 5, wins: 24, status: "Retired", debut: 1950 },
  { name: "Phil Hill", country: "United States", continent: "North America", series: SERIES.F1, team: "Cooper", titles: 1, wins: 3, status: "Retired", debut: 1958 },
  { name: "Mike Hawthorn", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 1, wins: 3, status: "Retired", debut: 1952 },
  { name: "Alberto Ascari", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Lancia", titles: 2, wins: 13, status: "Retired", debut: 1950 },
  { name: "Giuseppe Farina", country: "Italy", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 1, wins: 5, status: "Retired", debut: 1950 },
  { name: "Stirling Moss", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "Lotus (Rob Walker)", titles: 0, wins: 16, status: "Retired", debut: 1951 },
  { name: "Wolfgang von Trips", country: "Germany", continent: "Europe", series: SERIES.F1, team: "Ferrari", titles: 0, wins: 2, status: "Retired", debut: 1957 },
  { name: "Tony Brooks", country: "United Kingdom", continent: "Europe", series: SERIES.F1, team: "BRM", titles: 0, wins: 6, status: "Retired", debut: 1956 },
  { name: "Jose Froilan Gonzalez", country: "Argentina", continent: "South America", series: SERIES.F1, team: "Ferrari", titles: 0, wins: 2, status: "Retired", debut: 1950 },

  // ================= NASCAR CUP — active =================
  { name: "Kyle Larson",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 2, wins: 35,  status: "Active",  debut: 2013 }, // 2025 Cup champ; wins approx, verify exact
  { name: "Chase Elliott",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 1, wins: 19,  status: "Active",  debut: 2015 },
  { name: "William Byron",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 0, wins: 13,  status: "Active",  debut: 2018 },
  { name: "Alex Bowman",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 0, wins: 8,   status: "Active",  debut: 2014 },
  { name: "Denny Hamlin",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 0, wins: 54,  status: "Active",  debut: 2005 },
  { name: "Christopher Bell",    country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 0, wins: 9,   status: "Active",  debut: 2020 },
  { name: "Chase Briscoe",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 0, wins: 3,   status: "Active",  debut: 2021 },
  { name: "Ty Gibbs",            country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 0, wins: 0,   status: "Active",  debut: 2022 },
  { name: "Joey Logano",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Team Penske",              titles: 3, wins: 36,  status: "Active",  debut: 2008 },
  { name: "Ryan Blaney",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Team Penske",              titles: 1, wins: 13,  status: "Active",  debut: 2014 },
  { name: "Austin Cindric",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Team Penske",              titles: 0, wins: 2,   status: "Active",  debut: 2021 },
  { name: "Kyle Busch",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Richard Childress Racing", titles: 2, wins: 63,  status: "Active",  debut: 2004 },
  { name: "Austin Dillon",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Richard Childress Racing", titles: 0, wins: 5,   status: "Active",  debut: 2014 },
  { name: "Brad Keselowski",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "RFK Racing",               titles: 1, wins: 36,  status: "Active",  debut: 2008 },
  { name: "Chris Buescher",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "RFK Racing",               titles: 0, wins: 6,   status: "Active",  debut: 2015 },
  { name: "Ryan Preece",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "RFK Racing",               titles: 0, wins: 0,   status: "Active",  debut: 2019 },
  { name: "Tyler Reddick",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "23XI Racing",              titles: 0, wins: 8,   status: "Active",  debut: 2020 },
  { name: "Bubba Wallace",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "23XI Racing",              titles: 0, wins: 2,   status: "Active",  debut: 2017 },
  { name: "Riley Herbst",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "23XI Racing",              titles: 0, wins: 0,   status: "Active",  debut: 2025 },
  { name: "Ross Chastain",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Trackhouse Racing",        titles: 0, wins: 5,   status: "Active",  debut: 2017 },
  { name: "Shane van Gisbergen", country: "New Zealand",    continent: "Oceania",       series: SERIES.NASCAR, team: "Trackhouse Racing",        titles: 0, wins: 1,   status: "Active",  debut: 2023 },
  { name: "Daniel Suarez",       country: "Mexico",         continent: "North America", series: SERIES.NASCAR, team: "Trackhouse Racing",        titles: 0, wins: 2,   status: "Active",  debut: 2017 },
  { name: "Erik Jones",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Legacy Motor Club",        titles: 0, wins: 3,   status: "Active",  debut: 2015 },
  { name: "John Hunter Nemechek", country: "United States", continent: "North America", series: SERIES.NASCAR, team: "Legacy Motor Club",        titles: 0, wins: 0,   status: "Active",  debut: 2020 },
  { name: "Michael McDowell",    country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Spire Motorsports",        titles: 0, wins: 2,   status: "Active",  debut: 2008 },
  { name: "Justin Haley",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Spire Motorsports",        titles: 0, wins: 1,   status: "Active",  debut: 2019 },
  { name: "Carson Hocevar",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Spire Motorsports",        titles: 0, wins: 0,   status: "Active",  debut: 2024 },
  { name: "Todd Gilliland",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Front Row Motorsports",    titles: 0, wins: 0,   status: "Active",  debut: 2022 },
  { name: "Noah Gragson",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Front Row Motorsports",    titles: 0, wins: 0,   status: "Active",  debut: 2023 },
  { name: "Zane Smith",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Front Row Motorsports",    titles: 0, wins: 0,   status: "Active",  debut: 2024 },
  { name: "Ricky Stenhouse Jr.", country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hyak Motorsports",         titles: 0, wins: 3,   status: "Active",  debut: 2013 },
  { name: "AJ Allmendinger",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Kaulig Racing",            titles: 0, wins: 2,   status: "Active",  debut: 2007 },
  { name: "Ty Dillon",           country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Kaulig Racing",            titles: 0, wins: 0,   status: "Active",  debut: 2017 },
  { name: "Josh Berry",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Wood Brothers Racing",     titles: 0, wins: 1,   status: "Active",  debut: 2024 },
  { name: "Cole Custer",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Haas Factory Team",        titles: 0, wins: 1,   status: "Active",  debut: 2020 },

  // ================= NASCAR CUP — retired =================
  { name: "Richard Petty",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Petty Enterprises",        titles: 7, wins: 200, status: "Retired", debut: 1958 },
  { name: "Dale Earnhardt",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Richard Childress Racing", titles: 7, wins: 76,  status: "Retired", debut: 1975 },
  { name: "Jimmie Johnson",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Legacy Motor Club",        titles: 7, wins: 83,  status: "Retired", debut: 2001 },
  { name: "Jeff Gordon",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 4, wins: 93,  status: "Retired", debut: 1992 },
  { name: "David Pearson",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Wood Brothers Racing",     titles: 3, wins: 105, status: "Retired", debut: 1960 },
  { name: "Cale Yarborough",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Cale Yarborough Motorsport", titles: 3, wins: 83, status: "Retired", debut: 1957 },
  { name: "Darrell Waltrip",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Travis Carter Enterprises", titles: 3, wins: 84,  status: "Retired", debut: 1972 },
  { name: "Lee Petty",           country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Petty Enterprises",        titles: 3, wins: 54,  status: "Retired", debut: 1949 },
  { name: "Tony Stewart",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Stewart-Haas Racing",      titles: 3, wins: 49,  status: "Retired", debut: 1999 },
  { name: "Terry Labonte",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 2, wins: 22,  status: "Retired", debut: 1978 },
  { name: "Ned Jarrett",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Bondy Long",               titles: 2, wins: 50,  status: "Retired", debut: 1953 },
  { name: "Buck Baker",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Buck Baker Racing",        titles: 2, wins: 46,  status: "Retired", debut: 1949 },
  { name: "Tim Flock",           country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Kiekhaefer Mercury",       titles: 2, wins: 39,  status: "Retired", debut: 1949 },
  { name: "Herb Thomas",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Kiekhaefer Mercury",       titles: 2, wins: 48,  status: "Retired", debut: 1949 },
  { name: "Joe Weatherly",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Bud Moore Engineering",    titles: 2, wins: 25,  status: "Retired", debut: 1952 },
  { name: "Bobby Allison",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Stavola Brothers Racing",  titles: 1, wins: 85,  status: "Retired", debut: 1961 },
  { name: "Rusty Wallace",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Team Penske",              titles: 1, wins: 55,  status: "Retired", debut: 1980 },
  { name: "Bill Elliott",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Evernham Motorsports",     titles: 1, wins: 44,  status: "Retired", debut: 1976 },
  { name: "Alan Kulwicki",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "AK Racing",                titles: 1, wins: 5,   status: "Retired", debut: 1985 },
  { name: "Dale Jarrett",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Michael Waltrip Racing",   titles: 1, wins: 32,  status: "Retired", debut: 1984 },
  { name: "Bobby Labonte",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "JTG Daugherty Racing",     titles: 1, wins: 21,  status: "Retired", debut: 1991 },
  { name: "Matt Kenseth",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Chip Ganassi Racing",      titles: 1, wins: 39,  status: "Retired", debut: 1998 },
  { name: "Kurt Busch",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "23XI Racing",              titles: 1, wins: 34,  status: "Retired", debut: 2000 },
  { name: "Kevin Harvick",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Stewart-Haas Racing",      titles: 1, wins: 60,  status: "Retired", debut: 2001 },
  { name: "Martin Truex Jr.",    country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 1, wins: 34,  status: "Retired", debut: 2004 },
  { name: "Bobby Isaac",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "K&K Insurance Dodge",      titles: 1, wins: 37,  status: "Retired", debut: 1961 },
  { name: "Rex White",           country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "White & Clements",         titles: 1, wins: 28,  status: "Retired", debut: 1956 },
  { name: "Benny Parsons",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "L.G. DeWitt Racing",       titles: 1, wins: 21,  status: "Retired", debut: 1964 }, // verify last team
  { name: "Dale Earnhardt Jr.",  country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 0, wins: 26,  status: "Retired", debut: 1999 },
  { name: "Mark Martin",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Michael Waltrip Racing",   titles: 0, wins: 40,  status: "Retired", debut: 1981 },
  { name: "Junior Johnson",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Junior Johnson & Associates", titles: 0, wins: 50, status: "Retired", debut: 1953 },
  { name: "Fireball Roberts",    country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Holman-Moody",             titles: 0, wins: 33,  status: "Retired", debut: 1950 },
  { name: "Carl Edwards",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 0, wins: 28,  status: "Retired", debut: 2004 },
  { name: "Ricky Rudd",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Robert Yates Racing",      titles: 0, wins: 23,  status: "Retired", debut: 1975 },
  { name: "Jeff Burton",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Richard Childress Racing", titles: 0, wins: 21,  status: "Retired", debut: 1993 },
  { name: "Greg Biffle",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Roush Fenway Racing",      titles: 0, wins: 19,  status: "Retired", debut: 2002 },
  { name: "Davey Allison",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Robert Yates Racing",      titles: 0, wins: 19,  status: "Retired", debut: 1987 },
  { name: "Buddy Baker",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Baker-Schiff Racing",      titles: 0, wins: 19,  status: "Retired", debut: 1959 }, // verify last team
  { name: "Kasey Kahne",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Leavine Family Racing",    titles: 0, wins: 18,  status: "Retired", debut: 2004 },
  { name: "Ryan Newman",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Roush Fenway Racing",      titles: 0, wins: 18,  status: "Retired", debut: 2000 },
  { name: "Harry Gant",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Leo Jackson Motorsports",  titles: 0, wins: 18,  status: "Retired", debut: 1973 },
  { name: "Neil Bonnett",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "RahMoc Enterprises",       titles: 0, wins: 18,  status: "Retired", debut: 1974 }, // verify last team
  { name: "Ernie Irvan",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "MB2 Motorsports",          titles: 0, wins: 15,  status: "Retired", debut: 1987 },
  { name: "Tim Richmond",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 0, wins: 13,  status: "Retired", debut: 1980 },
  { name: "Sterling Marlin",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Ginn Racing",              titles: 0, wins: 10,  status: "Retired", debut: 1976 },
  { name: "Clint Bowyer",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Stewart-Haas Racing",      titles: 0, wins: 10,  status: "Retired", debut: 2005 },
  { name: "Kyle Petty",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Petty Enterprises",        titles: 0, wins: 8,   status: "Retired", debut: 1979 },
  { name: "Jamie McMurray",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Chip Ganassi Racing",      titles: 0, wins: 7,   status: "Retired", debut: 2002 },
  { name: "Ward Burton",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Haas CNC Racing",          titles: 0, wins: 5,   status: "Retired", debut: 1994 },
  { name: "Michael Waltrip",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Michael Waltrip Racing",   titles: 0, wins: 4,   status: "Retired", debut: 1985 },
  { name: "Aric Almirola",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Stewart-Haas Racing",      titles: 0, wins: 3,   status: "Retired", debut: 2007 },
  { name: "Harrison Burton",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Wood Brothers Racing",     titles: 0, wins: 1,   status: "Retired", debut: 2022 },

  // ================= INDYCAR (modern series + pre-1979 USAC) =================
  { name: "Alex Palou",          country: "Spain",          continent: "Europe",        series: SERIES.INDYCAR, team: "Chip Ganassi Racing",   titles: 4, wins: 19, status: "Active",  debut: 2020 }, // 2021/23/24/25 titles (validated)
  { name: "Scott Dixon",         country: "New Zealand",    continent: "Oceania",       series: SERIES.INDYCAR, team: "Chip Ganassi Racing",   titles: 6, wins: 58, status: "Active",  debut: 2001 },
  { name: "Josef Newgarden",     country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Team Penske",           titles: 2, wins: 29, status: "Active",  debut: 2012 },
  { name: "Will Power",          country: "Australia",      continent: "Oceania",       series: SERIES.INDYCAR, team: "Team Penske",           titles: 2, wins: 44, status: "Active",  debut: 2008 },
  { name: "Pato O'Ward",         country: "Mexico",         continent: "North America", series: SERIES.INDYCAR, team: "Arrow McLaren",         titles: 0, wins: 7,  status: "Active",  debut: 2018 },
  { name: "Colton Herta",        country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Andretti Global",       titles: 0, wins: 9,  status: "Active",  debut: 2019 },
  { name: "Scott McLaughlin",    country: "New Zealand",    continent: "Oceania",       series: SERIES.INDYCAR, team: "Team Penske",           titles: 0, wins: 7,  status: "Active",  debut: 2020 },
  { name: "Kyle Kirkwood",       country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Andretti Global",       titles: 0, wins: 3,  status: "Active",  debut: 2022 },
  { name: "Marcus Ericsson",     country: "Sweden",         continent: "Europe",        series: SERIES.INDYCAR, team: "Andretti Global",       titles: 0, wins: 4,  status: "Active",  debut: 2019 },
  { name: "Alexander Rossi",     country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Ed Carpenter Racing",   titles: 0, wins: 8,  status: "Active",  debut: 2016 },
  { name: "Graham Rahal",        country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Rahal Letterman Lanigan", titles: 0, wins: 6, status: "Active", debut: 2007 },
  { name: "Christian Lundgaard", country: "Denmark",        continent: "Europe",        series: SERIES.INDYCAR, team: "Arrow McLaren",         titles: 0, wins: 1,  status: "Active",  debut: 2022 },
  { name: "Felix Rosenqvist",    country: "Sweden",         continent: "Europe",        series: SERIES.INDYCAR, team: "Meyer Shank Racing",    titles: 0, wins: 1,  status: "Active",  debut: 2019 },
  { name: "Rinus VeeKay",        country: "Netherlands",    continent: "Europe",        series: SERIES.INDYCAR, team: "Dale Coyne Racing",     titles: 0, wins: 1,  status: "Active",  debut: 2020 },
  { name: "Santino Ferrucci",    country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "A.J. Foyt Enterprises", titles: 0, wins: 0,  status: "Active",  debut: 2019 },
  { name: "A.J. Foyt",           country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "A.J. Foyt Enterprises", titles: 7, wins: 67, status: "Retired", debut: 1957 },
  { name: "Mario Andretti",      country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Newman/Haas Racing",    titles: 4, wins: 52, status: "Retired", debut: 1964 },
  { name: "Dario Franchitti",    country: "United Kingdom", continent: "Europe",        series: SERIES.INDYCAR, team: "Chip Ganassi Racing",   titles: 4, wins: 31, status: "Retired", debut: 1997 },
  { name: "Sam Hornish Jr.",     country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Team Penske",           titles: 3, wins: 19, status: "Retired", debut: 2000 },
  { name: "Al Unser",            country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Team Penske",           titles: 3, wins: 39, status: "Retired", debut: 1964 },
  { name: "Bobby Unser",         country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Patrick Racing",        titles: 2, wins: 35, status: "Retired", debut: 1963 },
  { name: "Tony Kanaan",         country: "Brazil",         continent: "South America", series: SERIES.INDYCAR, team: "Arrow McLaren",         titles: 1, wins: 17, status: "Retired", debut: 1998 },
  { name: "Dan Wheldon",         country: "United Kingdom", continent: "Europe",        series: SERIES.INDYCAR, team: "Bryan Herta Autosport", titles: 1, wins: 16, status: "Retired", debut: 2002 },
  { name: "Ryan Hunter-Reay",    country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Dreyer & Reinbold",     titles: 1, wins: 18, status: "Retired", debut: 2003 }, // verify last team
  { name: "Simon Pagenaud",      country: "France",         continent: "Europe",        series: SERIES.INDYCAR, team: "Meyer Shank Racing",    titles: 1, wins: 15, status: "Retired", debut: 2007 },
  { name: "Johnny Rutherford",   country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Chaparral Racing",      titles: 1, wins: 27, status: "Retired", debut: 1962 }, // verify last team
  { name: "Gordon Johncock",     country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Patrick Racing",        titles: 1, wins: 25, status: "Retired", debut: 1965 },
  { name: "Helio Castroneves",   country: "Brazil",         continent: "South America", series: SERIES.INDYCAR, team: "Meyer Shank Racing",    titles: 0, wins: 31, status: "Retired", debut: 1998 },
  { name: "Marco Andretti",      country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Andretti Global",       titles: 0, wins: 2,  status: "Retired", debut: 2006 },
  { name: "Ed Carpenter",        country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Ed Carpenter Racing",   titles: 0, wins: 3,  status: "Retired", debut: 2003 },
  { name: "James Hinchcliffe",   country: "Canada",         continent: "North America", series: SERIES.INDYCAR, team: "Arrow McLaren SP",      titles: 0, wins: 6,  status: "Retired", debut: 2011 },
  { name: "Takuma Sato",         country: "Japan",          continent: "Asia",          series: SERIES.INDYCAR, team: "Rahal Letterman Lanigan", titles: 0, wins: 6, status: "Retired", debut: 2010 },
  { name: "Danica Patrick",      country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Andretti Autosport",    titles: 0, wins: 1,  status: "Retired", debut: 2005 },

  // ================= CART / CHAMP CAR (peak 1979–2007) =================
  { name: "Sebastien Bourdais",  country: "France",         continent: "Europe",        series: SERIES.CART, team: "A.J. Foyt Enterprises",  titles: 4, wins: 37, status: "Retired", debut: 2003 }, // verify last team
  { name: "Bobby Rahal",         country: "United States",  continent: "North America", series: SERIES.CART, team: "Team Rahal",             titles: 3, wins: 24, status: "Retired", debut: 1982 },
  { name: "Rick Mears",          country: "United States",  continent: "North America", series: SERIES.CART, team: "Team Penske",            titles: 3, wins: 29, status: "Retired", debut: 1978 },
  { name: "Alex Zanardi",        country: "Italy",          continent: "Europe",        series: SERIES.CART, team: "Chip Ganassi Racing",    titles: 2, wins: 15, status: "Retired", debut: 1996 },
  { name: "Gil de Ferran",       country: "Brazil",         continent: "South America", series: SERIES.CART, team: "Team Penske",            titles: 2, wins: 12, status: "Retired", debut: 1995 },
  { name: "Al Unser Jr.",        country: "United States",  continent: "North America", series: SERIES.CART, team: "Kelley Racing",          titles: 2, wins: 34, status: "Retired", debut: 1982 }, // verify last team
  { name: "Jimmy Vasser",        country: "United States",  continent: "North America", series: SERIES.CART, team: "PKV Racing",             titles: 1, wins: 10, status: "Retired", debut: 1992 },
  { name: "Cristiano da Matta",  country: "Brazil",         continent: "South America", series: SERIES.CART, team: "RuSPORT",                titles: 1, wins: 12, status: "Retired", debut: 1999 }, // verify
  { name: "Paul Tracy",          country: "Canada",         continent: "North America", series: SERIES.CART, team: "Forsythe Racing",        titles: 1, wins: 31, status: "Retired", debut: 1991 },
  { name: "Michael Andretti",    country: "United States",  continent: "North America", series: SERIES.CART, team: "Team Green",             titles: 1, wins: 42, status: "Retired", debut: 1983 },
  { name: "Danny Sullivan",      country: "United States",  continent: "North America", series: SERIES.CART, team: "PacWest Racing",         titles: 1, wins: 17, status: "Retired", debut: 1982 },
  { name: "Greg Moore",          country: "Canada",         continent: "North America", series: SERIES.CART, team: "Forsythe Racing",        titles: 0, wins: 5,  status: "Retired", debut: 1996 },
  { name: "Adrian Fernandez",    country: "Mexico",         continent: "North America", series: SERIES.CART, team: "Fernandez Racing",       titles: 0, wins: 11, status: "Retired", debut: 1993 },
  { name: "Justin Wilson",       country: "United Kingdom", continent: "Europe",        series: SERIES.CART, team: "Andretti Autosport",     titles: 0, wins: 7,  status: "Retired", debut: 2003 },

  // ================= V8 SUPERCARS (ATCC lineage) =================
  { name: "Jamie Whincup",       country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Triple Eight Race Engineering", titles: 7, wins: 124, status: "Retired", debut: 2003 },
  { name: "Mark Skaife",         country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Holden Racing Team",     titles: 5, wins: 90,  status: "Retired", debut: 1987 },
  { name: "Dick Johnson",        country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Dick Johnson Racing",    titles: 5, wins: 30,  status: "Retired", debut: 1973 }, // verify wins
  { name: "Allan Moffat",        country: "Canada",         continent: "North America", series: SERIES.SUPERCARS, team: "Allan Moffat Racing",    titles: 4, wins: 32,  status: "Retired", debut: 1965 }, // verify
  { name: "Jim Richards",        country: "New Zealand",    continent: "Oceania",       series: SERIES.SUPERCARS, team: "Gibson Motorsport",      titles: 4, wins: 35,  status: "Retired", debut: 1974 }, // verify
  { name: "Peter Brock",         country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Holden Racing Team",     titles: 3, wins: 37,  status: "Retired", debut: 1972 },
  { name: "Craig Lowndes",       country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Triple Eight Race Engineering", titles: 3, wins: 110, status: "Retired", debut: 1994 },
  { name: "Glenn Seton",         country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Ford Tickford Racing",   titles: 2, wins: 35,  status: "Retired", debut: 1984 }, // verify wins
  { name: "Marcos Ambrose",      country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "DJR Team Penske",        titles: 2, wins: 28,  status: "Retired", debut: 2001 },
  { name: "Garth Tander",        country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Garry Rogers Motorsport", titles: 1, wins: 55, status: "Retired", debut: 1998 },
  { name: "Mark Winterbottom",   country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Team 18",                titles: 1, wins: 40,  status: "Active",  debut: 2004 }, // verify status
  { name: "Russell Ingall",      country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Lucas Dumbrell Motorsport", titles: 1, wins: 12, status: "Retired", debut: 1996 }, // verify
  { name: "Rick Kelly",          country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Kelly Racing",           titles: 1, wins: 12,  status: "Retired", debut: 2002 }, // verify wins
  { name: "James Courtney",      country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Blanchard Racing Team",  titles: 1, wins: 15,  status: "Active",  debut: 2006 }, // verify status
  { name: "John Bowe",           country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Brad Jones Racing",      titles: 1, wins: 20,  status: "Retired", debut: 1985 }, // verify
  { name: "Greg Murphy",         country: "New Zealand",    continent: "Oceania",       series: SERIES.SUPERCARS, team: "Paul Morris Motorsport", titles: 0, wins: 28,  status: "Retired", debut: 1996 }, // verify last team
  { name: "Will Brown",          country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Triple Eight Race Engineering", titles: 1, wins: 15, status: "Active", debut: 2021 }, // verify wins
  { name: "Broc Feeney",         country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Triple Eight Race Engineering", titles: 0, wins: 15, status: "Active", debut: 2022 }, // verify: possible 2025 title
  { name: "Brodie Kostecki",     country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Dick Johnson Racing",    titles: 1, wins: 8,   status: "Active",  debut: 2021 },
  { name: "Chaz Mostert",        country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Walkinshaw Andretti United", titles: 0, wins: 22, status: "Active", debut: 2013 },
  { name: "Cameron Waters",      country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Tickford Racing",        titles: 0, wins: 12,  status: "Active",  debut: 2016 },
  { name: "Will Davison",        country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Dick Johnson Racing",    titles: 0, wins: 22,  status: "Active",  debut: 2004 }, // verify status
  { name: "Anton De Pasquale",   country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Team 18",                titles: 0, wins: 10,  status: "Active",  debut: 2018 },
  { name: "David Reynolds",      country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Team 18",                titles: 0, wins: 6,   status: "Active",  debut: 2010 }, // verify team
  { name: "Matt Payne",          country: "New Zealand",    continent: "Oceania",       series: SERIES.SUPERCARS, team: "Grove Racing",           titles: 0, wins: 5,   status: "Active",  debut: 2023 },
  { name: "Andre Heimgartner",   country: "New Zealand",    continent: "Oceania",       series: SERIES.SUPERCARS, team: "Brad Jones Racing",      titles: 0, wins: 2,   status: "Active",  debut: 2015 },
  { name: "Nick Percat",         country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Matt Stone Racing",      titles: 0, wins: 3,   status: "Active",  debut: 2014 },
  { name: "Thomas Randle",       country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Tickford Racing",        titles: 0, wins: 1,   status: "Active",  debut: 2022 },
  { name: "Fabian Coulthard",    country: "New Zealand",    continent: "Oceania",       series: SERIES.SUPERCARS, team: "DJR Team Penske",        titles: 0, wins: 13,  status: "Retired", debut: 2008 },
  { name: "Larry Perkins",       country: "Australia",      continent: "Oceania",       series: SERIES.SUPERCARS, team: "Perkins Engineering",    titles: 0, wins: 5,   status: "Retired", debut: 1977 }, // verify wins

  // ================= IMSA (top class, incl. Grand-Am era) =================
  { name: "Peter Gregg",         country: "United States",  continent: "North America", series: SERIES.IMSA, team: "Brumos Porsche",          titles: 6, wins: 41, status: "Retired", debut: 1971 }, // verify
  { name: "Al Holbert",          country: "United States",  continent: "North America", series: SERIES.IMSA, team: "Holbert Racing",          titles: 5, wins: 49, status: "Retired", debut: 1974 },
  { name: "Scott Pruett",        country: "United States",  continent: "North America", series: SERIES.IMSA, team: "Chip Ganassi Racing",     titles: 5, wins: 60, status: "Retired", debut: 1986 }, // verify wins
  { name: "Geoff Brabham",       country: "Australia",      continent: "Oceania",       series: SERIES.IMSA, team: "Nissan Performance (NPTI)", titles: 4, wins: 25, status: "Retired", debut: 1984 }, // verify
  { name: "Felipe Nasr",         country: "Brazil",         continent: "South America", series: SERIES.IMSA, team: "Porsche Penske Motorsport", titles: 3, wins: 15, status: "Active", debut: 2018 }, // verify wins
  { name: "Hurley Haywood",      country: "United States",  continent: "North America", series: SERIES.IMSA, team: "Brumos Porsche",          titles: 2, wins: 25, status: "Retired", debut: 1971 }, // verify
  { name: "Juan Manuel Fangio II", country: "Argentina",    continent: "South America", series: SERIES.IMSA, team: "All American Racers",     titles: 2, wins: 20, status: "Retired", debut: 1988 }, // verify wins
  { name: "Ricky Taylor",        country: "United States",  continent: "North America", series: SERIES.IMSA, team: "Wayne Taylor Racing",     titles: 3, wins: 30, status: "Active",  debut: 2008 }, // verify titles
  { name: "Jordan Taylor",       country: "United States",  continent: "North America", series: SERIES.IMSA, team: "Wayne Taylor Racing",     titles: 2, wins: 25, status: "Active",  debut: 2010 }, // verify
  { name: "Filipe Albuquerque",  country: "Portugal",       continent: "Europe",        series: SERIES.IMSA, team: "Wayne Taylor Racing",     titles: 2, wins: 20, status: "Active",  debut: 2013 }, // verify
  { name: "Pipo Derani",         country: "Brazil",         continent: "South America", series: SERIES.IMSA, team: "Action Express Racing",   titles: 2, wins: 20, status: "Active",  debut: 2016 }, // verify
  { name: "Dane Cameron",        country: "United States",  continent: "North America", series: SERIES.IMSA, team: "Porsche Penske Motorsport", titles: 2, wins: 15, status: "Active", debut: 2014 }, // verify
  { name: "Matt Campbell",       country: "Australia",      continent: "Oceania",       series: SERIES.IMSA, team: "Porsche Penske Motorsport", titles: 1, wins: 8, status: "Active", debut: 2019 }, // verify titles
  { name: "Tom Blomqvist",       country: "United Kingdom", continent: "Europe",        series: SERIES.IMSA, team: "Meyer Shank Racing",      titles: 1, wins: 8,  status: "Active",  debut: 2021 },
  { name: "Nick Tandy",          country: "United Kingdom", continent: "Europe",        series: SERIES.IMSA, team: "Porsche Penske Motorsport", titles: 0, wins: 15, status: "Active", debut: 2012 }, // verify
  { name: "Mathieu Jaminet",     country: "France",         continent: "Europe",        series: SERIES.IMSA, team: "Porsche Penske Motorsport", titles: 0, wins: 8, status: "Active", debut: 2018 }, // verify
  { name: "Colin Braun",         country: "United States",  continent: "North America", series: SERIES.IMSA, team: "JDC-Miller MotorSports",  titles: 0, wins: 10, status: "Active",  debut: 2007 }, // verify

  // ================= WEC (incl. pre-2012 World Sportscar legends) =================
  { name: "Sebastien Buemi",     country: "Switzerland",    continent: "Europe",        series: SERIES.WEC, team: "Toyota Gazoo Racing",     titles: 4, wins: 25, status: "Active",  debut: 2012 },
  { name: "Brendon Hartley",     country: "New Zealand",    continent: "Oceania",       series: SERIES.WEC, team: "Toyota Gazoo Racing",     titles: 4, wins: 20, status: "Active",  debut: 2012 },
  { name: "Ryo Hirakawa",        country: "Japan",          continent: "Asia",          series: SERIES.WEC, team: "Toyota Gazoo Racing",     titles: 2, wins: 10, status: "Active",  debut: 2022 },
  { name: "Andre Lotterer",      country: "Germany",        continent: "Europe",        series: SERIES.WEC, team: "Porsche Penske Motorsport", titles: 2, wins: 18, status: "Active", debut: 2012 },
  { name: "Timo Bernhard",       country: "Germany",        continent: "Europe",        series: SERIES.WEC, team: "Porsche LMP Team",        titles: 2, wins: 12, status: "Retired", debut: 2014 },
  { name: "Derek Bell",          country: "United Kingdom", continent: "Europe",        series: SERIES.WEC, team: "Rothmans Porsche",        titles: 2, wins: 20, status: "Retired", debut: 1970 }, // WSC era
  { name: "Anthony Davidson",    country: "United Kingdom", continent: "Europe",        series: SERIES.WEC, team: "Toyota Gazoo Racing",     titles: 1, wins: 10, status: "Retired", debut: 2012 },
  { name: "Neel Jani",           country: "Switzerland",    continent: "Europe",        series: SERIES.WEC, team: "Porsche LMP Team",        titles: 1, wins: 8,  status: "Retired", debut: 2012 },
  { name: "Romain Dumas",        country: "France",         continent: "Europe",        series: SERIES.WEC, team: "Glickenhaus Racing",      titles: 1, wins: 10, status: "Retired", debut: 2012 },
  { name: "Marcel Fassler",      country: "Switzerland",    continent: "Europe",        series: SERIES.WEC, team: "Audi Sport Team Joest",   titles: 1, wins: 15, status: "Retired", debut: 2012 },
  { name: "Benoit Treluyer",     country: "France",         continent: "Europe",        series: SERIES.WEC, team: "Audi Sport Team Joest",   titles: 1, wins: 12, status: "Retired", debut: 2012 },
  { name: "Loic Duval",          country: "France",         continent: "Europe",        series: SERIES.WEC, team: "Peugeot TotalEnergies",   titles: 1, wins: 8,  status: "Active",  debut: 2012 },
  { name: "Tom Kristensen",      country: "Denmark",        continent: "Europe",        series: SERIES.WEC, team: "Audi Sport Team Joest",   titles: 1, wins: 10, status: "Retired", debut: 1997 }, // 9x Le Mans winner
  { name: "Allan McNish",        country: "United Kingdom", continent: "Europe",        series: SERIES.WEC, team: "Audi Sport Team Joest",   titles: 1, wins: 8,  status: "Retired", debut: 1997 },
  { name: "Mike Conway",         country: "United Kingdom", continent: "Europe",        series: SERIES.WEC, team: "Toyota Gazoo Racing",     titles: 1, wins: 15, status: "Active",  debut: 2014 },
  { name: "Kamui Kobayashi",     country: "Japan",          continent: "Asia",          series: SERIES.WEC, team: "Toyota Gazoo Racing",     titles: 1, wins: 15, status: "Active",  debut: 2016 },
  { name: "Jose Maria Lopez",    country: "Argentina",      continent: "South America", series: SERIES.WEC, team: "Toyota Gazoo Racing",     titles: 1, wins: 15, status: "Active",  debut: 2017 },
  { name: "Kevin Estre",         country: "France",         continent: "Europe",        series: SERIES.WEC, team: "Porsche Penske Motorsport", titles: 1, wins: 10, status: "Active", debut: 2016 },
  { name: "Laurens Vanthoor",    country: "Belgium",        continent: "Europe",        series: SERIES.WEC, team: "Porsche Penske Motorsport", titles: 1, wins: 8, status: "Active", debut: 2017 },
  { name: "Stefan Bellof",       country: "Germany",        continent: "Europe",        series: SERIES.WEC, team: "Brun Motorsport",         titles: 1, wins: 4,  status: "Retired", debut: 1983 }, // WSC era

  // ================= WRC =================
  { name: "Sebastien Loeb",      country: "France",         continent: "Europe",        series: SERIES.WRC, team: "M-Sport Ford",            titles: 9, wins: 80, status: "Retired", debut: 1999 },
  { name: "Sebastien Ogier",     country: "France",         continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",     titles: 9, wins: 68, status: "Active",  debut: 2008 }, // 2025 WRC title (ties Loeb at 9)
  { name: "Juha Kankkunen",      country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Hyundai",                 titles: 4, wins: 23, status: "Retired", debut: 1983 }, // verify last team
  { name: "Tommi Makinen",       country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Subaru",                  titles: 4, wins: 24, status: "Retired", debut: 1987 },
  { name: "Walter Rohrl",        country: "Germany",        continent: "Europe",        series: SERIES.WRC, team: "Audi Sport",              titles: 2, wins: 14, status: "Retired", debut: 1973 },
  { name: "Carlos Sainz Sr",     country: "Spain",          continent: "Europe",        series: SERIES.WRC, team: "Citroen",                 titles: 2, wins: 26, status: "Retired", debut: 1987 },
  { name: "Marcus Gronholm",     country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "BP Ford",                 titles: 2, wins: 30, status: "Retired", debut: 1989 },
  { name: "Miki Biasion",        country: "Italy",          continent: "Europe",        series: SERIES.WRC, team: "Ford",                    titles: 2, wins: 17, status: "Retired", debut: 1983 },
  { name: "Kalle Rovanpera",     country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",     titles: 2, wins: 15, status: "Retired", debut: 2017 }, // left WRC for circuit racing after 2025
  { name: "Richard Burns",       country: "United Kingdom", continent: "Europe",        series: SERIES.WRC, team: "Peugeot",                 titles: 1, wins: 10, status: "Retired", debut: 1990 },
  { name: "Petter Solberg",      country: "Norway",         continent: "Europe",        series: SERIES.WRC, team: "Ford World Rally Team",   titles: 1, wins: 13, status: "Retired", debut: 1998 }, // verify last team
  { name: "Bjorn Waldegard",     country: "Sweden",         continent: "Europe",        series: SERIES.WRC, team: "Toyota",                  titles: 1, wins: 16, status: "Retired", debut: 1973 },
  { name: "Ari Vatanen",         country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Ford",                    titles: 1, wins: 10, status: "Retired", debut: 1974 },
  { name: "Hannu Mikkola",       country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Mazda Rally Team",        titles: 1, wins: 18, status: "Retired", debut: 1973 },
  { name: "Timo Salonen",        country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Mazda Rally Team",        titles: 1, wins: 11, status: "Retired", debut: 1974 },
  { name: "Stig Blomqvist",      country: "Sweden",         continent: "Europe",        series: SERIES.WRC, team: "Ford",                    titles: 1, wins: 11, status: "Retired", debut: 1973 },
  { name: "Didier Auriol",       country: "France",         continent: "Europe",        series: SERIES.WRC, team: "Skoda",                   titles: 1, wins: 20, status: "Retired", debut: 1988 },
  { name: "Ott Tanak",           country: "Estonia",        continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 1, wins: 22, status: "Active",  debut: 2009 },
  { name: "Thierry Neuville",    country: "Belgium",        continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 1, wins: 22, status: "Active",  debut: 2009 },
  { name: "Colin McRae",         country: "United Kingdom", continent: "Europe",        series: SERIES.WRC, team: "Citroen",                 titles: 1, wins: 25, status: "Retired", debut: 1986 },
  { name: "Elfyn Evans",         country: "United Kingdom", continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",     titles: 0, wins: 11, status: "Active",  debut: 2013 }, // 2025 WRC runner-up
  { name: "Jari-Matti Latvala",  country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",     titles: 0, wins: 18, status: "Retired", debut: 2002 },
  { name: "Mikko Hirvonen",      country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Citroen",                 titles: 0, wins: 15, status: "Retired", debut: 2002 },
  { name: "Markku Alen",         country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Subaru",                  titles: 0, wins: 19, status: "Retired", debut: 1973 },
  { name: "Henri Toivonen",      country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Martini Lancia",          titles: 0, wins: 3,  status: "Retired", debut: 1975 },
  { name: "Michele Mouton",      country: "France",         continent: "Europe",        series: SERIES.WRC, team: "Audi",                    titles: 0, wins: 4,  status: "Retired", debut: 1974 },
  { name: "Dani Sordo",          country: "Spain",          continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 0, wins: 3,  status: "Retired", debut: 2006 },
  { name: "Esapekka Lappi",      country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 0, wins: 1,  status: "Retired", debut: 2017 },
  { name: "Kris Meeke",          country: "United Kingdom", continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",     titles: 0, wins: 5,  status: "Retired", debut: 2009 },
  { name: "Hayden Paddon",       country: "New Zealand",    continent: "Oceania",       series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 0, wins: 1,  status: "Retired", debut: 2013 },
  { name: "Andreas Mikkelsen",   country: "Norway",         continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 0, wins: 3,  status: "Retired", debut: 2011 },
  { name: "Craig Breen",         country: "Ireland",        continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 0, wins: 0,  status: "Retired", debut: 2016 },
  { name: "Takamoto Katsuta",    country: "Japan",          continent: "Asia",          series: SERIES.WRC, team: "Toyota Gazoo Racing",     titles: 0, wins: 0,  status: "Active",  debut: 2020 },
  { name: "Adrien Fourmaux",     country: "France",         continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",      titles: 0, wins: 0,  status: "Active",  debut: 2021 },
  { name: "Sami Pajari",         country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",     titles: 0, wins: 0,  status: "Active",  debut: 2024 },
];
