const fs   = require('fs');
const path = require('path');

const MODEL_PATH = path.join(__dirname, 'model_weights.json');

// Tunable weights
const ALPHA = 0.7;  // CF
const BETA  = 0.3;  // Location
const CLICK_WEIGHT = 0.4;

const EVENT_CATEGORIES = [
  'Music', 'Sports', 'Art', 'Food And Drink',
  'Education', 'Festival', 'Other',
];

// Cached model
let MODEL = null;

function loadModel() {
  if (MODEL) return MODEL;

  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error('model_weights.json not found. Run: node ml/train.js');
  }

  MODEL = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));

  const { meta } = MODEL;
  console.log(`[BlockTix ML] Model loaded — ${meta.algorithm}`);
  console.log(`[BlockTix ML] Factors: ${meta.nFactors} | RMSE: ${meta.finalRMSE}`);

  return MODEL;
}

// Math Helpers


function dot(a, b) {
  let s = 0;
  for (let k = 0; k < a.length; k++) s += a[k] * b[k];
  return s;
}

// Normalize MF score → 0–1
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// Location scoring
function getLocationScore(userCity, eventCity) {
  if (!userCity || !eventCity) return 0.5;
  if (userCity === eventCity) return 1.0;
  return 0.3;
}

// Core Scoring

function mfCategoryScores(userId) {
  const {
    userIdx, eventIdx, eventIds,
    P, Q, eventCat, eventCity, userCity
  } = loadModel();

  const uid = String(userId);
  if (userIdx[uid] === undefined) return null;

  const ui = userIdx[uid];

  const catScore = {};
  const catCount = {};

  for (const eid of eventIds) {
    const ei  = eventIdx[eid];
    const cat = eventCat[eid];

    if (!cat || ei === undefined) continue;

    // CF score
    const cfScore = sigmoid(dot(P[ui], Q[ei]));

    // Location score
    const locScore = getLocationScore(
      userCity?.[uid],
      eventCity?.[eid]
    );

    // Hybrid score
    const finalScore = ALPHA * cfScore + BETA * locScore;

    catScore[cat] = (catScore[cat] || 0) + finalScore;
    catCount[cat] = (catCount[cat] || 0) + 1;
  }

  const result = {};
  for (const cat in catScore) {
    result[cat] = catScore[cat] / catCount[cat];
  }

  return result;
}

// Global fallback

function globalTopCategories(top) {
  const { eventCat } = loadModel();

  const counts = {};
  for (const cat of Object.values(eventCat)) {
    counts[cat] = (counts[cat] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([cat]) => cat);
}

// Public API

async function getRecommendedCategories(userId, top = 3, clickScores = {}) {
  const scores = mfCategoryScores(userId);

  if (!scores) {
    return globalTopCategories(top);
  }

  // Normalize clicks
  const maxClicks = Math.max(1, ...Object.values(clickScores));

  const combined = { ...scores };

  for (const [cat, clicks] of Object.entries(clickScores)) {
    const normalized = clicks / maxClicks;
    combined[cat] = (combined[cat] || 0) + CLICK_WEIGHT * normalized;
  }

  const ranked = Object.entries(combined)
    .filter(([c]) => c !== 'All')
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .slice(0, top);

  // Padding
  if (ranked.length < top) {
    for (const c of globalTopCategories(top)) {
      if (!ranked.includes(c)) ranked.push(c);
      if (ranked.length === top) break;
    }
  }

  return ranked;
}

async function getRecommendedCategoriesVerbose(userId, top = 3, clickScores = {}) {
  const scores = mfCategoryScores(userId);

  if (!scores) {
    return globalTopCategories(top).map(c => ({
      category: c,
      score: 0,
      method: 'global_popularity',
    }));
  }

  const maxClicks = Math.max(1, ...Object.values(clickScores));
  const combined = { ...scores };

  for (const [cat, clicks] of Object.entries(clickScores)) {
    const normalized = clicks / maxClicks;
    combined[cat] = (combined[cat] || 0) + CLICK_WEIGHT * normalized;
  }

  const result = Object.entries(combined)
    .filter(([c]) => c !== 'All')
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([c, s]) => ({
      category: c,
      score: Math.round(s * 10000) / 10000,
      method: 'hybrid_cf_location_click',
    }));

  while (result.length < top) {
    for (const c of globalTopCategories(top)) {
      if (!result.find(r => r.category === c)) {
        result.push({
          category: c,
          score: 0,
          method: 'global_popularity'
        });
      }
      if (result.length === top) break;
    }
  }

  return result;
}

// Utilities

function getKnownUserIds() {
  const { userIds } = loadModel();
  return userIds.map(Number).sort((a, b) => a - b);
}

module.exports = {
  getRecommendedCategories,
  getRecommendedCategoriesVerbose,
  getKnownUserIds,
  EVENT_CATEGORIES,
};