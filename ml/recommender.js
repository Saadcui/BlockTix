const fs = require("fs");
const path = require("path");


// Event categories

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

// Event category mapping

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
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i]));
    return obj;
  });
  return rows;
}


// DATA LOADING (CACHED)

let CACHE = null;
let USER_MATRIX = null;

function mapGenresToCategories(genresField) {
  if (!genresField || genresField === "(no genres listed)") return ["Other"];
  const genres = genresField.split("|");
  const set = new Set();
  for (const g of genres) set.add(GENRE_TO_CATEGORY[g] || "Other");
  return [...set];
}

function loadData() {
  if (CACHE) return CACHE;

  const moviesPath = path.join(__dirname, "movies.csv");
  const ratingsPath = path.join(__dirname, "ratings.csv");

  if (!fs.existsSync(moviesPath) || !fs.existsSync(ratingsPath)) {
    throw new Error("MovieLens CSV files not found in ml/");
  }

  const moviesCSV = parseCSV(fs.readFileSync(moviesPath, "utf8"));
  const ratingsCSV = parseCSV(fs.readFileSync(ratingsPath, "utf8"));

  const moviesMap = new Map();
  moviesCSV.forEach((m) => {
    moviesMap.set(
      String(m.movieId),
      mapGenresToCategories(m.genres)
    );
  });

  const ratings = ratingsCSV.map((r) => ({
    userId: String(r.userId),
    movieId: String(r.movieId),
    rating: Number(r.rating),
  }));

  CACHE = { moviesMap, ratings };
  return CACHE;
}


//USER–ITEM MATRIX

function buildUserMatrix() {
  const { ratings } = loadData();
  const matrix = {};

  for (const r of ratings) {
    if (!matrix[r.userId]) matrix[r.userId] = {};
    matrix[r.userId][r.movieId] = r.rating;
  }
  return matrix;
}

function getUserMatrix() {
  if (!USER_MATRIX) USER_MATRIX = buildUserMatrix();
  return USER_MATRIX;
}


// COLLABORATIVE FILTERING

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;

  for (const k in a) {
    if (b[k]) dot += a[k] * b[k];
    normA += a[k] ** 2;
  }
  for (const k in b) normB += b[k] ** 2;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function getSimilarUsers(userId, k = 5) {
  const matrix = getUserMatrix();
  const target = matrix[userId];
  if (!target) return [];

  return Object.entries(matrix)
    .filter(([uid]) => uid !== userId)
    .map(([uid, ratings]) => ({
      userId: uid,
      sim: cosineSimilarity(target, ratings),
    }))
    .filter((u) => u.sim > 0)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);
}


// CATEGORY SCORING (CF-BASED)

function computeCategoryStatsCF(userId) {
  const { moviesMap } = loadData();
  const matrix = getUserMatrix();
  const neighbors = getSimilarUsers(userId);

  const score = {};
  const weight = {};

  for (const n of neighbors) {
    const ratings = matrix[n.userId];
    for (const movieId in ratings) {
      const cats = moviesMap.get(movieId) || ["Other"];
      for (const c of cats) {
        score[c] = (score[c] || 0) + ratings[movieId] * n.sim;
        weight[c] = (weight[c] || 0) + n.sim;
      }
    }
  }

  return Object.keys(score)
    .map((c) => ({
      category: c,
      avg: score[c] / (weight[c] || 1),
      count: weight[c],
    }))
    .sort((a, b) => b.avg - a.avg);
}


// COLD-START FALLBACK

function getGlobalTopCategories(top = 3) {
  const { ratings, moviesMap } = loadData();
  const stats = {};

  for (const r of ratings) {
    const cats = moviesMap.get(r.movieId) || ["Other"];
    for (const c of cats) {
      if (!stats[c]) stats[c] = { sum: 0, count: 0 };
      stats[c].sum += r.rating;
      stats[c].count++;
    }
  }

  return Object.entries(stats)
    .map(([c, v]) => ({ category: c, avg: v.sum / v.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, top)
    .map((v) => v.category);
}


async function getRecommendedCategories(userId, top = 3) {
  const matrix = getUserMatrix();

  if (!matrix[userId]) {
    return getGlobalTopCategories(top);
  }

  return computeCategoryStatsCF(userId)
    .filter((a) => a.category !== "All")
    .slice(0, top)
    .map((a) => a.category);
}

async function getRecommendedCategoriesVerbose(userId, top = 3) {
  const matrix = getUserMatrix();

  if (!matrix[userId]) {
    return getGlobalTopCategories(top).map((c) => ({
      category: c,
      avg: 0,
      count: 0,
    }));
  }

  return computeCategoryStatsCF(userId)
    .filter((a) => a.category !== "All")
    .slice(0, top);
}

function getKnownUserIds() {
  return Object.keys(getUserMatrix()).sort((a, b) => Number(a) - Number(b));
}

module.exports = {
  getRecommendedCategories,
  getRecommendedCategoriesVerbose,
  getKnownUserIds,
  EVENT_CATEGORIES,
};