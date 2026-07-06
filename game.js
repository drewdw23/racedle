"use strict";

/* ============================================================
   RACEDLE — game logic
   Pure logic (evaluation, seeding) is kept separate from DOM
   rendering so it can be unit-tested later.
   ============================================================ */

/* ---------- Config ---------- */
const EPOCH_UTC = Date.UTC(2026, 6, 5); // puzzle #1 = July 5, 2026 (UTC)
const SITE_URL = "https://drewdw23.github.io/racedle/";

const WIN_BANDS = [
  { max: 0, label: "0" },
  { max: 9, label: "1–9" },
  { max: 24, label: "10–24" },
  { max: 49, label: "25–49" },
  { max: 99, label: "50–99" },
  { max: Infinity, label: "100+" },
];

/* ---------- Pure helpers ---------- */
function bandIndex(wins) {
  return WIN_BANDS.findIndex((b) => wins <= b.max);
}
function bandLabel(wins) {
  return WIN_BANDS[bandIndex(wins)].label;
}
function decadeOf(year) {
  return Math.floor(year / 10) * 10;
}
function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function flagFor(country) {
  return FLAGS[country] || "";
}

/* Deterministic PRNG so every player gets the same daily driver. */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayPuzzleNumber() {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.floor((todayUTC - EPOCH_UTC) / 86400000) + 1);
}

function driverForPuzzle(n) {
  const rand = mulberry32(Math.imul(n, 2654435761) >>> 0)();
  return DRIVERS[Math.floor(rand * DRIVERS.length)];
}

/*
 * Compare a guessed driver against the answer.
 * Returns 7 cells: { value, status: green|yellow|gray, arrow: up|down|null }
 *  - Nationality: yellow = same continent
 *  - Titles / Wins band / Decade: yellow = off by one step, arrow points
 *    toward the answer's value
 */
function evaluateGuess(guess, answer) {
  const cells = [];

  const natStatus =
    guess.country === answer.country ? "green" :
    guess.continent === answer.continent ? "yellow" : "gray";
  cells.push({ value: `${flagFor(guess.country)} ${guess.country}`, status: natStatus, arrow: null });

  cells.push({ value: guess.series, status: guess.series === answer.series ? "green" : "gray", arrow: null });
  cells.push({ value: guess.team, status: guess.team === answer.team ? "green" : "gray", arrow: null });

  const titleDiff = answer.titles - guess.titles;
  cells.push({
    value: String(guess.titles),
    status: titleDiff === 0 ? "green" : Math.abs(titleDiff) === 1 ? "yellow" : "gray",
    arrow: titleDiff === 0 ? null : titleDiff > 0 ? "up" : "down",
  });

  const bandDiff = bandIndex(answer.wins) - bandIndex(guess.wins);
  cells.push({
    value: bandLabel(guess.wins),
    status: bandDiff === 0 ? "green" : Math.abs(bandDiff) === 1 ? "yellow" : "gray",
    arrow: bandDiff === 0 ? null : bandDiff > 0 ? "up" : "down",
  });

  cells.push({ value: guess.status, status: guess.status === answer.status ? "green" : "gray", arrow: null });

  const decDiff = (decadeOf(answer.debut) - decadeOf(guess.debut)) / 10;
  cells.push({
    value: `${decadeOf(guess.debut)}s`,
    status: decDiff === 0 ? "green" : Math.abs(decDiff) === 1 ? "yellow" : "gray",
    arrow: decDiff === 0 ? null : decDiff > 0 ? "up" : "down",
  });

  return cells;
}

/* ---------- Persistence ---------- */
const LS_DAILY = "racedle_daily_v1";
const LS_STATS = "racedle_stats_v1";

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — game still playable */
  }
}
function defaultStats() {
  return { played: 0, won: 0, streak: 0, maxStreak: 0, lastPlayedPuzzle: 0, lastWonPuzzle: 0, totalGuesses: 0 };
}

/* ---------- Game state ---------- */
const state = {
  mode: "daily", // "daily" | "free"
  puzzle: todayPuzzleNumber(),
  answer: null,
  guesses: [], // driver objects, in guess order
  solved: false,
};

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
let suggestionIndex = -1;

function init() {
  state.answer = driverForPuzzle(state.puzzle);
  $("puzzle-number").textContent = "#" + state.puzzle;

  restoreDaily();
  renderYesterday();
  bindEvents();
  setInterval(tickCountdown, 1000);
  tickCountdown();
}

function bindEvents() {
  const input = $("guess-input");
  input.addEventListener("input", () => renderSuggestions(input.value));
  input.addEventListener("keydown", onInputKey);
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".guess-box")) hideSuggestions();
  });

  $("tab-daily").addEventListener("click", () => switchMode("daily"));
  $("tab-free").addEventListener("click", () => switchMode("free"));
  $("free-new").addEventListener("click", startFreeGame);
  $("share-btn").addEventListener("click", shareResult);

  $("btn-how").addEventListener("click", () => toggleModal("modal-how", true));
  $("btn-stats").addEventListener("click", () => {
    renderStats();
    toggleModal("modal-stats", true);
  });
  document.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", () => toggleModal(el.getAttribute("data-close"), false))
  );
}

function toggleModal(id, show) {
  $(id).classList.toggle("open", show);
}

/* ---------- Modes ---------- */
function switchMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  $("tab-daily").classList.toggle("active", mode === "daily");
  $("tab-free").classList.toggle("active", mode === "free");
  $("free-new").classList.toggle("hidden", mode !== "free");
  $("daily-tagline").classList.toggle("hidden", mode !== "daily");

  if (mode === "daily") {
    state.puzzle = todayPuzzleNumber();
    state.answer = driverForPuzzle(state.puzzle);
    state.guesses = [];
    state.solved = false;
    clearBoard();
    restoreDaily();
  } else {
    startFreeGame();
  }
}

function startFreeGame() {
  state.answer = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
  state.guesses = [];
  state.solved = false;
  clearBoard();
  $("win-panel").classList.add("hidden");
  setInputEnabled(true);
  updateGuessCount();
}

/* ---------- Daily persistence ---------- */
function restoreDaily() {
  const saved = loadJSON(LS_DAILY, null);
  if (saved && saved.puzzle === state.puzzle) {
    for (const name of saved.guesses) {
      const driver = DRIVERS.find((d) => d.name === name);
      if (driver) applyGuess(driver, false);
    }
  }
  updateGuessCount();
}

function persistDaily() {
  if (state.mode !== "daily") return;
  saveJSON(LS_DAILY, {
    puzzle: state.puzzle,
    guesses: state.guesses.map((d) => d.name),
    solved: state.solved,
  });
}

/* ---------- Guessing ---------- */
function submitGuess(driver) {
  if (state.solved || state.guesses.some((d) => d.name === driver.name)) return;
  applyGuess(driver, true);

  if (state.mode === "daily") {
    const stats = loadJSON(LS_STATS, defaultStats());
    if (stats.lastPlayedPuzzle !== state.puzzle) {
      stats.played += 1;
      stats.lastPlayedPuzzle = state.puzzle;
    }
    if (state.solved) {
      stats.won += 1;
      stats.totalGuesses += state.guesses.length;
      stats.streak = stats.lastWonPuzzle === state.puzzle - 1 ? stats.streak + 1 : 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
      stats.lastWonPuzzle = state.puzzle;
    }
    saveJSON(LS_STATS, stats);
    persistDaily();
  }
}

function applyGuess(driver, animate) {
  state.guesses.push(driver);
  const cells = evaluateGuess(driver, state.answer);
  addGuessRow(driver, cells, animate);

  $("guess-input").value = "";
  hideSuggestions();
  updateGuessCount();

  if (driver.name === state.answer.name) {
    state.solved = true;
    setInputEnabled(false);
    showWinPanel(animate);
  }
}

function setInputEnabled(enabled) {
  const input = $("guess-input");
  input.disabled = !enabled;
  input.placeholder = enabled ? "Type a driver's name…" : "Solved!";
  if (enabled) input.focus();
}

/* ---------- Rendering ---------- */
function clearBoard() {
  $("board-body").innerHTML = "";
  $("board").classList.add("hidden");
}

function addGuessRow(driver, cells, animate) {
  $("board").classList.remove("hidden");
  const row = document.createElement("div");
  row.className = "board-row";

  const nameTile = document.createElement("div");
  nameTile.className = "tile name-tile" + (animate ? " flip" : "");
  nameTile.textContent = driver.name;
  row.appendChild(nameTile);

  cells.forEach((cell, i) => {
    const tile = document.createElement("div");
    tile.className = `tile ${cell.status}` + (animate ? " flip" : "");
    if (animate) tile.style.animationDelay = `${(i + 1) * 0.12}s`;
    const val = document.createElement("span");
    val.textContent = cell.value;
    tile.appendChild(val);
    if (cell.arrow) {
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = cell.arrow === "up" ? "▲" : "▼";
      arrow.title = cell.arrow === "up" ? "The answer is higher" : "The answer is lower";
      tile.appendChild(arrow);
    }
    row.appendChild(tile);
  });

  $("board-body").prepend(row);
}

function updateGuessCount() {
  $("guess-count").textContent =
    state.guesses.length === 0 ? "" :
    state.guesses.length === 1 ? "1 guess" : `${state.guesses.length} guesses`;
}

function showWinPanel(animate) {
  const panel = $("win-panel");
  panel.classList.remove("hidden");
  $("win-driver").textContent = `${flagFor(state.answer.country)} ${state.answer.name}`;
  $("win-guesses").textContent =
    state.guesses.length === 1 ? "first try — pole position!" : `solved in ${state.guesses.length} guesses`;
  $("share-btn").classList.toggle("hidden", state.mode !== "daily");
  $("countdown-wrap").classList.toggle("hidden", state.mode !== "daily");
  if (animate) {
    panel.classList.remove("pop");
    void panel.offsetWidth; // restart animation
    panel.classList.add("pop");
  }
}

function renderYesterday() {
  if (state.puzzle > 1) {
    const prev = driverForPuzzle(state.puzzle - 1);
    $("yesterday").textContent = `Yesterday's driver (#${state.puzzle - 1}): ${prev.name}`;
  }
}

/* ---------- Suggestions ---------- */
function renderSuggestions(query) {
  const box = $("suggestions");
  const q = norm(query.trim());
  if (!q || state.solved) return hideSuggestions();

  const guessed = new Set(state.guesses.map((d) => d.name));
  const matches = DRIVERS.filter((d) => !guessed.has(d.name) && norm(d.name).includes(q)).slice(0, 8);
  if (matches.length === 0) return hideSuggestions();

  box.innerHTML = "";
  matches.forEach((d, i) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "suggestion" + (i === suggestionIndex ? " highlighted" : "");
    item.innerHTML = `<span>${flagFor(d.country)} ${d.name}</span><span class="sugg-series">${d.series}</span>`;
    item.addEventListener("click", () => submitGuess(d));
    box.appendChild(item);
  });
  box.classList.remove("hidden");
  box.dataset.names = JSON.stringify(matches.map((d) => d.name));
}

function hideSuggestions() {
  $("suggestions").classList.add("hidden");
  suggestionIndex = -1;
}

function onInputKey(e) {
  const box = $("suggestions");
  if (box.classList.contains("hidden")) return;
  const names = JSON.parse(box.dataset.names || "[]");

  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const dir = e.key === "ArrowDown" ? 1 : -1;
    suggestionIndex = (suggestionIndex + dir + names.length) % names.length;
    [...box.children].forEach((el, i) => el.classList.toggle("highlighted", i === suggestionIndex));
  } else if (e.key === "Enter") {
    e.preventDefault();
    const pick = suggestionIndex >= 0 ? names[suggestionIndex] : names[0];
    const driver = DRIVERS.find((d) => d.name === pick);
    if (driver) submitGuess(driver);
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
}

/* ---------- Countdown ---------- */
function tickCountdown() {
  const now = new Date();
  const nextUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const ms = nextUTC - now.getTime();
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  $("countdown").textContent = `${h}:${m}:${s}`;

  if (state.mode === "daily" && todayPuzzleNumber() !== state.puzzle) {
    $("countdown").textContent = "New puzzle available — refresh the page!";
  }
}

/* ---------- Share ---------- */
function shareResult() {
  const emoji = { green: "\u{1F7E9}", yellow: "\u{1F7E7}", gray: "⬛" };
  const lines = state.guesses.map((d) =>
    evaluateGuess(d, state.answer).map((c) => emoji[c.status]).join("")
  );
  const text = `Racedle #${state.puzzle} \u{1F3C1} ${state.guesses.length}/∞\n\n${lines.join("\n")}\n\n${SITE_URL}`;

  const done = () => {
    const btn = $("share-btn");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "\u{1F4CB} Share result"), 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  done();
}

/* ---------- Stats ---------- */
function renderStats() {
  const s = loadJSON(LS_STATS, defaultStats());
  $("stat-played").textContent = s.played;
  $("stat-winrate").textContent = s.played ? Math.round((100 * s.won) / s.played) + "%" : "–";
  $("stat-streak").textContent = s.streak;
  $("stat-max-streak").textContent = s.maxStreak;
  $("stat-avg").textContent = s.won ? (s.totalGuesses / s.won).toFixed(1) : "–";
}

document.addEventListener("DOMContentLoaded", init);
