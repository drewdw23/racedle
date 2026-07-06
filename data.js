/* ============================================================
   MOTORDLE — Driver database
   ------------------------------------------------------------
   DATA VINTAGE (verify before public launch — see BUSINESS_PLAN.md):
   - Teams reflect 2025/2026 season rosters.
   - Career stats (titles, wins) are through the END OF THE 2024
     SEASON for active drivers. Win counts are only ever shown as
     bands (0, 1-9, 10-24, 25-49, 50-99, 100+), which buffers
     staleness, but borderline drivers should be re-checked.
   - "Championships" = titles in the driver's top-level primary
     series (e.g. premier-class only for MotoGP riders).
   - "Debut" = first start in their primary series' top class.
   - Status rule: Active = competing full-time (or as a regular
     part-time title contender) in their primary series.
   ============================================================ */

const SERIES = {
  F1: "Formula 1",
  NASCAR: "NASCAR Cup",
  INDYCAR: "IndyCar",
  MOTOGP: "MotoGP",
  WRC: "WRC",
};

const FLAGS = {
  "Argentina": "🇦🇷", "Australia": "🇦🇺", "Austria": "🇦🇹", "Belgium": "🇧🇪",
  "Brazil": "🇧🇷", "Canada": "🇨🇦", "Denmark": "🇩🇰", "Estonia": "🇪🇪",
  "Finland": "🇫🇮", "France": "🇫🇷", "Germany": "🇩🇪", "Italy": "🇮🇹",
  "Japan": "🇯🇵", "Mexico": "🇲🇽", "Monaco": "🇲🇨", "Netherlands": "🇳🇱",
  "New Zealand": "🇳🇿", "Spain": "🇪🇸", "Thailand": "🇹🇭",
  "United Kingdom": "🇬🇧", "United States": "🇺🇸",
};

/* name, country, continent, series, team (current/last), titles,
   wins (career, used only to derive the band), status, debut year */
const DRIVERS = [
  // ---------- Formula 1 — active ----------
  { name: "Max Verstappen",      country: "Netherlands",    continent: "Europe",        series: SERIES.F1, team: "Red Bull",            titles: 4, wins: 63,  status: "Active",  debut: 2015 },
  { name: "Lewis Hamilton",      country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "Ferrari",             titles: 7, wins: 105, status: "Active",  debut: 2007 },
  { name: "Charles Leclerc",     country: "Monaco",         continent: "Europe",        series: SERIES.F1, team: "Ferrari",             titles: 0, wins: 8,   status: "Active",  debut: 2018 },
  { name: "Lando Norris",        country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "McLaren",             titles: 0, wins: 4,   status: "Active",  debut: 2019 },
  { name: "Oscar Piastri",       country: "Australia",      continent: "Oceania",       series: SERIES.F1, team: "McLaren",             titles: 0, wins: 2,   status: "Active",  debut: 2023 },
  { name: "George Russell",      country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "Mercedes",            titles: 0, wins: 3,   status: "Active",  debut: 2019 },
  { name: "Fernando Alonso",     country: "Spain",          continent: "Europe",        series: SERIES.F1, team: "Aston Martin",        titles: 2, wins: 32,  status: "Active",  debut: 2001 },
  { name: "Carlos Sainz",        country: "Spain",          continent: "Europe",        series: SERIES.F1, team: "Williams",            titles: 0, wins: 4,   status: "Active",  debut: 2015 },
  { name: "Pierre Gasly",        country: "France",         continent: "Europe",        series: SERIES.F1, team: "Alpine",              titles: 0, wins: 1,   status: "Active",  debut: 2017 },
  { name: "Esteban Ocon",        country: "France",         continent: "Europe",        series: SERIES.F1, team: "Haas",                titles: 0, wins: 1,   status: "Active",  debut: 2016 },
  { name: "Alexander Albon",     country: "Thailand",       continent: "Asia",          series: SERIES.F1, team: "Williams",            titles: 0, wins: 0,   status: "Active",  debut: 2019 },
  { name: "Yuki Tsunoda",        country: "Japan",          continent: "Asia",          series: SERIES.F1, team: "Red Bull",            titles: 0, wins: 0,   status: "Active",  debut: 2021 },
  { name: "Nico Hulkenberg",     country: "Germany",        continent: "Europe",        series: SERIES.F1, team: "Sauber",              titles: 0, wins: 0,   status: "Active",  debut: 2010 },
  { name: "Lance Stroll",        country: "Canada",         continent: "North America", series: SERIES.F1, team: "Aston Martin",        titles: 0, wins: 0,   status: "Active",  debut: 2017 },
  { name: "Kimi Antonelli",      country: "Italy",          continent: "Europe",        series: SERIES.F1, team: "Mercedes",            titles: 0, wins: 0,   status: "Active",  debut: 2025 },
  { name: "Oliver Bearman",      country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "Haas",                titles: 0, wins: 0,   status: "Active",  debut: 2024 },
  { name: "Isack Hadjar",        country: "France",         continent: "Europe",        series: SERIES.F1, team: "Racing Bulls",        titles: 0, wins: 0,   status: "Active",  debut: 2025 },
  { name: "Gabriel Bortoleto",   country: "Brazil",         continent: "South America", series: SERIES.F1, team: "Sauber",              titles: 0, wins: 0,   status: "Active",  debut: 2025 },
  { name: "Liam Lawson",         country: "New Zealand",    continent: "Oceania",       series: SERIES.F1, team: "Racing Bulls",        titles: 0, wins: 0,   status: "Active",  debut: 2023 },
  { name: "Franco Colapinto",    country: "Argentina",      continent: "South America", series: SERIES.F1, team: "Alpine",              titles: 0, wins: 0,   status: "Active",  debut: 2024 },
  { name: "Sergio Perez",        country: "Mexico",         continent: "North America", series: SERIES.F1, team: "Cadillac",            titles: 0, wins: 6,   status: "Active",  debut: 2011 },
  { name: "Valtteri Bottas",     country: "Finland",        continent: "Europe",        series: SERIES.F1, team: "Cadillac",            titles: 0, wins: 10,  status: "Active",  debut: 2013 },

  // ---------- Formula 1 — retired ----------
  { name: "Michael Schumacher",  country: "Germany",        continent: "Europe",        series: SERIES.F1, team: "Mercedes",            titles: 7, wins: 91,  status: "Retired", debut: 1991 },
  { name: "Sebastian Vettel",    country: "Germany",        continent: "Europe",        series: SERIES.F1, team: "Aston Martin",        titles: 4, wins: 53,  status: "Retired", debut: 2007 },
  { name: "Kimi Raikkonen",      country: "Finland",        continent: "Europe",        series: SERIES.F1, team: "Alfa Romeo",          titles: 1, wins: 21,  status: "Retired", debut: 2001 },
  { name: "Ayrton Senna",        country: "Brazil",         continent: "South America", series: SERIES.F1, team: "Williams",            titles: 3, wins: 41,  status: "Retired", debut: 1984 },
  { name: "Alain Prost",         country: "France",         continent: "Europe",        series: SERIES.F1, team: "Williams",            titles: 4, wins: 51,  status: "Retired", debut: 1980 },
  { name: "Nigel Mansell",       country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "McLaren",             titles: 1, wins: 31,  status: "Retired", debut: 1980 },
  { name: "Mika Hakkinen",       country: "Finland",        continent: "Europe",        series: SERIES.F1, team: "McLaren",             titles: 2, wins: 20,  status: "Retired", debut: 1991 },
  { name: "Jenson Button",       country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "McLaren",             titles: 1, wins: 15,  status: "Retired", debut: 2000 },
  { name: "Nico Rosberg",        country: "Germany",        continent: "Europe",        series: SERIES.F1, team: "Mercedes",            titles: 1, wins: 23,  status: "Retired", debut: 2006 },
  { name: "Felipe Massa",        country: "Brazil",         continent: "South America", series: SERIES.F1, team: "Williams",            titles: 0, wins: 11,  status: "Retired", debut: 2002 },
  { name: "Mark Webber",         country: "Australia",      continent: "Oceania",       series: SERIES.F1, team: "Red Bull",            titles: 0, wins: 9,   status: "Retired", debut: 2002 },
  { name: "Daniel Ricciardo",    country: "Australia",      continent: "Oceania",       series: SERIES.F1, team: "RB / AlphaTauri",     titles: 0, wins: 8,   status: "Retired", debut: 2011 },
  { name: "Niki Lauda",          country: "Austria",        continent: "Europe",        series: SERIES.F1, team: "McLaren",             titles: 3, wins: 25,  status: "Retired", debut: 1971 },
  { name: "Jackie Stewart",      country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "Tyrrell",             titles: 3, wins: 27,  status: "Retired", debut: 1965 },
  { name: "Jim Clark",           country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "Lotus",               titles: 2, wins: 25,  status: "Retired", debut: 1960 },
  { name: "Juan Manuel Fangio",  country: "Argentina",      continent: "South America", series: SERIES.F1, team: "Maserati",            titles: 5, wins: 24,  status: "Retired", debut: 1950 },
  { name: "Gilles Villeneuve",   country: "Canada",         continent: "North America", series: SERIES.F1, team: "Ferrari",             titles: 0, wins: 6,   status: "Retired", debut: 1977 },
  { name: "Jacques Villeneuve",  country: "Canada",         continent: "North America", series: SERIES.F1, team: "BMW Sauber",          titles: 1, wins: 11,  status: "Retired", debut: 1996 },
  { name: "Rubens Barrichello",  country: "Brazil",         continent: "South America", series: SERIES.F1, team: "Williams",            titles: 0, wins: 11,  status: "Retired", debut: 1993 },
  { name: "David Coulthard",     country: "United Kingdom", continent: "Europe",        series: SERIES.F1, team: "Red Bull",            titles: 0, wins: 13,  status: "Retired", debut: 1994 },
  { name: "Kevin Magnussen",     country: "Denmark",        continent: "Europe",        series: SERIES.F1, team: "Haas",                titles: 0, wins: 0,   status: "Retired", debut: 2014 },

  // ---------- NASCAR Cup ----------
  { name: "Kyle Larson",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 1, wins: 29,  status: "Active",  debut: 2013 },
  { name: "Chase Elliott",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 1, wins: 19,  status: "Active",  debut: 2015 },
  { name: "William Byron",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 0, wins: 13,  status: "Active",  debut: 2018 },
  { name: "Denny Hamlin",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 0, wins: 54,  status: "Active",  debut: 2005 },
  { name: "Christopher Bell",    country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 0, wins: 9,   status: "Active",  debut: 2020 },
  { name: "Joey Logano",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Team Penske",              titles: 3, wins: 36,  status: "Active",  debut: 2008 },
  { name: "Ryan Blaney",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Team Penske",              titles: 1, wins: 13,  status: "Active",  debut: 2014 },
  { name: "Kyle Busch",          country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Richard Childress Racing", titles: 2, wins: 63,  status: "Active",  debut: 2004 },
  { name: "Brad Keselowski",     country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "RFK Racing",               titles: 1, wins: 36,  status: "Active",  debut: 2008 },
  { name: "Tyler Reddick",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "23XI Racing",              titles: 0, wins: 8,   status: "Active",  debut: 2020 },
  { name: "Bubba Wallace",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "23XI Racing",              titles: 0, wins: 2,   status: "Active",  debut: 2017 },
  { name: "Ross Chastain",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Trackhouse Racing",        titles: 0, wins: 5,   status: "Active",  debut: 2017 },
  { name: "Shane van Gisbergen", country: "New Zealand",    continent: "Oceania",       series: SERIES.NASCAR, team: "Trackhouse Racing",        titles: 0, wins: 1,   status: "Active",  debut: 2023 },
  { name: "Jeff Gordon",         country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 4, wins: 93,  status: "Retired", debut: 1992 },
  { name: "Jimmie Johnson",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Legacy Motor Club",        titles: 7, wins: 83,  status: "Retired", debut: 2001 },
  { name: "Dale Earnhardt",      country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Richard Childress Racing", titles: 7, wins: 76,  status: "Retired", debut: 1975 },
  { name: "Dale Earnhardt Jr.",  country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Hendrick Motorsports",     titles: 0, wins: 26,  status: "Retired", debut: 1999 },
  { name: "Richard Petty",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Petty Enterprises",        titles: 7, wins: 200, status: "Retired", debut: 1958 },
  { name: "Tony Stewart",        country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Stewart-Haas Racing",      titles: 3, wins: 49,  status: "Retired", debut: 1999 },
  { name: "Kevin Harvick",       country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Stewart-Haas Racing",      titles: 1, wins: 60,  status: "Retired", debut: 2001 },
  { name: "Martin Truex Jr.",    country: "United States",  continent: "North America", series: SERIES.NASCAR, team: "Joe Gibbs Racing",         titles: 1, wins: 34,  status: "Retired", debut: 2004 },

  // ---------- IndyCar ----------
  { name: "Alex Palou",          country: "Spain",          continent: "Europe",        series: SERIES.INDYCAR, team: "Chip Ganassi Racing",  titles: 3, wins: 11, status: "Active",  debut: 2020 },
  { name: "Scott Dixon",         country: "New Zealand",    continent: "Oceania",       series: SERIES.INDYCAR, team: "Chip Ganassi Racing",  titles: 6, wins: 58, status: "Active",  debut: 2001 },
  { name: "Josef Newgarden",     country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Team Penske",          titles: 2, wins: 29, status: "Active",  debut: 2012 },
  { name: "Will Power",          country: "Australia",      continent: "Oceania",       series: SERIES.INDYCAR, team: "Team Penske",          titles: 2, wins: 44, status: "Active",  debut: 2008 },
  { name: "Pato O'Ward",         country: "Mexico",         continent: "North America", series: SERIES.INDYCAR, team: "Arrow McLaren",        titles: 0, wins: 7,  status: "Active",  debut: 2018 },
  { name: "Colton Herta",        country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Andretti Global",      titles: 0, wins: 9,  status: "Active",  debut: 2019 },
  { name: "Helio Castroneves",   country: "Brazil",         continent: "South America", series: SERIES.INDYCAR, team: "Meyer Shank Racing",   titles: 0, wins: 31, status: "Retired", debut: 1998 },
  { name: "Mario Andretti",      country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "Newman/Haas Racing",   titles: 4, wins: 52, status: "Retired", debut: 1964 },
  { name: "A.J. Foyt",           country: "United States",  continent: "North America", series: SERIES.INDYCAR, team: "A.J. Foyt Enterprises", titles: 7, wins: 67, status: "Retired", debut: 1957 },

  // ---------- MotoGP (premier class) ----------
  { name: "Marc Marquez",        country: "Spain",          continent: "Europe",        series: SERIES.MOTOGP, team: "Ducati Lenovo",         titles: 6, wins: 62, status: "Active",  debut: 2013 },
  { name: "Valentino Rossi",     country: "Italy",          continent: "Europe",        series: SERIES.MOTOGP, team: "Petronas Yamaha SRT",   titles: 7, wins: 89, status: "Retired", debut: 2000 },
  { name: "Francesco Bagnaia",   country: "Italy",          continent: "Europe",        series: SERIES.MOTOGP, team: "Ducati Lenovo",         titles: 2, wins: 27, status: "Active",  debut: 2019 },
  { name: "Fabio Quartararo",    country: "France",         continent: "Europe",        series: SERIES.MOTOGP, team: "Monster Energy Yamaha", titles: 1, wins: 11, status: "Active",  debut: 2019 },
  { name: "Jorge Martin",        country: "Spain",          continent: "Europe",        series: SERIES.MOTOGP, team: "Aprilia Racing",        titles: 1, wins: 5,  status: "Active",  debut: 2021 },
  { name: "Casey Stoner",        country: "Australia",      continent: "Oceania",       series: SERIES.MOTOGP, team: "Repsol Honda",          titles: 2, wins: 38, status: "Retired", debut: 2006 },
  { name: "Mick Doohan",         country: "Australia",      continent: "Oceania",       series: SERIES.MOTOGP, team: "Repsol Honda",          titles: 5, wins: 54, status: "Retired", debut: 1989 },
  { name: "Jorge Lorenzo",       country: "Spain",          continent: "Europe",        series: SERIES.MOTOGP, team: "Repsol Honda",          titles: 3, wins: 47, status: "Retired", debut: 2008 },
  { name: "Giacomo Agostini",    country: "Italy",          continent: "Europe",        series: SERIES.MOTOGP, team: "MV Agusta",             titles: 8, wins: 68, status: "Retired", debut: 1965 },
  { name: "Dani Pedrosa",        country: "Spain",          continent: "Europe",        series: SERIES.MOTOGP, team: "Repsol Honda",          titles: 0, wins: 31, status: "Retired", debut: 2006 },

  // ---------- WRC ----------
  { name: "Sebastien Loeb",      country: "France",         continent: "Europe",        series: SERIES.WRC, team: "M-Sport Ford",         titles: 9, wins: 80, status: "Retired", debut: 1999 },
  { name: "Sebastien Ogier",     country: "France",         continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",  titles: 8, wins: 62, status: "Active",  debut: 2008 },
  { name: "Kalle Rovanpera",     country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Toyota Gazoo Racing",  titles: 2, wins: 15, status: "Active",  debut: 2017 },
  { name: "Ott Tanak",           country: "Estonia",        continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",   titles: 1, wins: 22, status: "Active",  debut: 2009 },
  { name: "Thierry Neuville",    country: "Belgium",        continent: "Europe",        series: SERIES.WRC, team: "Hyundai Motorsport",   titles: 1, wins: 22, status: "Active",  debut: 2009 },
  { name: "Colin McRae",         country: "United Kingdom", continent: "Europe",        series: SERIES.WRC, team: "Citroen",              titles: 1, wins: 25, status: "Retired", debut: 1986 },
  { name: "Tommi Makinen",       country: "Finland",        continent: "Europe",        series: SERIES.WRC, team: "Subaru",               titles: 4, wins: 24, status: "Retired", debut: 1987 },
  { name: "Michele Mouton",      country: "France",         continent: "Europe",        series: SERIES.WRC, team: "Audi",                 titles: 0, wins: 4,  status: "Retired", debut: 1974 },
];
