const fs = require("fs");
const path = require("path");

// Event categories required by the app
const EVENT_CATEGORIES = [
  "Art",
  "Sports",
  "Food And Drink",
  "Education",
  "Festival",
  "Music",
  "Other",
  "All",
];

// Mapping from MovieLens genres to project event categories
// Updated mapping: Comedy, Romance, Children -> Food And Drink
const GENRE_TO_CATEGORY = {
  Action: "Sports",
  Adventure: "Sports",
  Animation: "Art",
  Children: "Food And Drink",
  Comedy: "Food And Drink",
  Crime: "Other",
  Documentary: "Education",
  Drama: "Art",
  Fantasy: "Festival",
  "Film-Noir": "Other",
  Horror: "Festival",
  Musical: "Music",
  Mystery: "Other",
  Romance: "Food And Drink",
  "Sci-Fi": "Education",
  Thriller: "Other",
  War: "Education",
  Western: "Other",
  IMAX: "Other",
};

function splitCSVLine(line) {
  const parts = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
  return parts.map((p) => {
    let s = p.trim();
    if (s.startsWith("\"") && s.endsWith("\"")) s = s.slice(1, -1);
    return s;
  });
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = splitCSVLine(line);
    const obj = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = cols[i] === undefined ? "" : cols[i];
    return obj;
  });
  return { headers, rows };
}

function mapGenresFieldToCategories(genresField) {
  if (!genresField || genresField === "(no genres listed)") return ["Other"];
  const genres = genresField.split("|").map((g) => g.trim()).filter(Boolean);
  const categories = new Set();
  for (const g of genres) {
    const cat = GENRE_TO_CATEGORY[g] || "Other";
    categories.add(cat);
  }
  return Array.from(categories);
}

function loadMovies(csvPath) {
  const content = fs.readFileSync(csvPath, "utf8");
  const { rows } = parseCSV(content);
  const map = new Map();
  for (const r of rows) {
    const movieId = r.movieId || r.movieId;
    const genresField = r.genres || r.genre || "";
    const categories = mapGenresFieldToCategories(genresField);
    map.set(String(movieId), categories);
  }
  return map;
}

function loadRatings(csvPath) {
  const content = fs.readFileSync(csvPath, "utf8");
  const { rows } = parseCSV(content);
  return rows.map((r) => ({ userId: String(r.userId), movieId: String(r.movieId), rating: Number(r.rating) }));
}

// Cache container
let CACHE = null;
function loadData() {
  if (CACHE) return CACHE;
  // Assume Next runtime cwd is client/, so csvs are at repo root one level up
  const repoRoot = path.resolve(process.cwd(), "..");
  const moviesPath = path.join(repoRoot, "movies.csv");
  const ratingsPath = path.join(repoRoot, "ratings.csv");
  if (!fs.existsSync(moviesPath) || !fs.existsSync(ratingsPath)) {
    throw new Error(`Could not find movies.csv or ratings.csv at ${repoRoot}`);
  }
  const moviesMap = loadMovies(moviesPath);
  const ratings = loadRatings(ratingsPath);
  CACHE = { moviesMap, ratings };
  return CACHE;
}

/**
 * Get recommended categories for a MovieLens numeric user id
 * @param {string|number} userId
 * @param {number} top default 3
 * @returns {Promise<string[]>}
 */
function computeCategoryStats(userId) {
  if (userId === undefined || userId === null) return [];
  const { moviesMap, ratings } = loadData();
  const stats = {};
  for (const r of ratings) {
    if (String(r.userId) !== String(userId)) continue;
    const categories = moviesMap.get(String(r.movieId)) || ["Other"];
    for (const c of categories) {
      if (!stats[c]) stats[c] = { sum: 0, count: 0 };
      stats[c].sum += r.rating;
      stats[c].count += 1;
    }
  }
  const averages = [];
  for (const cat of Object.keys(stats)) {
    const { sum, count } = stats[cat];
    if (count === 0) continue;
    averages.push({ category: cat, avg: sum / count, count });
  }
  averages.sort((a, b) => (b.avg === a.avg ? b.count - a.count : b.avg - a.avg));
  return averages;
}

async function getRecommendedCategories(userId, top = 3) {
  const averages = computeCategoryStats(userId);
  const result = averages.map((a) => a.category).filter((c) => c !== "All").slice(0, top);
  return result;
}

async function getRecommendedCategoriesVerbose(userId, top = 3) {
  const averages = computeCategoryStats(userId);
  const result = averages.filter((a) => a.category !== "All").slice(0, top);
  return result;
}

module.exports = { getRecommendedCategories, getRecommendedCategoriesVerbose, EVENT_CATEGORIES };
