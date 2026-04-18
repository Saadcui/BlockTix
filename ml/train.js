const fs   = require('fs');
const path = require('path');

const DATA_DIR   = __dirname;
const MODEL_PATH = path.join(DATA_DIR, 'model_weights.json');

// Hyperparameters
const N_FACTORS  = 20;    // number of latent factors (user/event embedding size)
const N_EPOCHS   = 30;    // number of full passes through training data
const LR         = 0.005; // learning rate
const REG        = 0.02;  // L2 regularisation lambda
const INTERACTION_WEIGHTS = { purchase: 3.0, view: 1.0, wishlist: 1.5 };

// CSV parser
function parseCSV(filePath) {
  const lines   = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj  = {};
    headers.forEach((h, i) => obj[h] = cols[i]?.trim());
    return obj;
  });
}

// Load data
console.log('\nBlockTix Matrix Factorization Trainer');
console.log('======================================');
console.log('Loading data...');

const eventsRaw = parseCSV(path.join(DATA_DIR, 'events.csv'));
const interRaw  = parseCSV(path.join(DATA_DIR, 'interactions.csv'));

// Index mappings
const userIds  = [...new Set(interRaw.map(r => r.user_id))].sort();
const eventIds = [...new Set(interRaw.map(r => r.event_id))].sort();
const userIdx  = Object.fromEntries(userIds.map((u, i)  => [u, i]));
const eventIdx = Object.fromEntries(eventIds.map((e, i) => [e, i]));
const nUsers   = userIds.length;
const nEvents  = eventIds.length;

// Event category lookup
const eventCat = {};
eventsRaw.forEach(e => eventCat[e.event_id] = e.category);

// Apply interaction weights, deduplicate (keep max weighted rating per user-event)
const ratingMap = {};
interRaw.forEach(r => {
  const key     = `${r.user_id}_${r.event_id}`;
  const w       = INTERACTION_WEIGHTS[r.interaction_type] || 1.0;
  const wRating = parseFloat(r.rating) * w;
  if (!ratingMap[key] || wRating > ratingMap[key].rating) {
    ratingMap[key] = { userId: r.user_id, eventId: r.event_id, rating: wRating };
  }
});
const ratings = Object.values(ratingMap);

console.log(`  Users           : ${nUsers}`);
console.log(`  Events          : ${nEvents}`);
console.log(`  Training samples: ${ratings.length}`);
console.log(`  Latent factors  : ${N_FACTORS}`);
console.log(`  Epochs          : ${N_EPOCHS}`);

// Initialise factor matrices with small random values
function randFactor() {
  return Array.from({ length: N_FACTORS }, () => (Math.random() - 0.5) * 0.1);
}
const P = Array.from({ length: nUsers },  randFactor); // user embeddings
const Q = Array.from({ length: nEvents }, randFactor); // event embeddings

function dot(a, b) {
  let s = 0;
  for (let k = 0; k < N_FACTORS; k++) s += a[k] * b[k];
  return s;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// SGD Training loop
console.log('\nTraining...\n');
let trainLoss = 0;

for (let epoch = 1; epoch <= N_EPOCHS; epoch++) {
  shuffle(ratings);
  let totalLoss = 0;

  for (const { userId, eventId, rating } of ratings) {
    const ui  = userIdx[userId];
    const ei  = eventIdx[eventId];
    const pu  = P[ui];
    const qi  = Q[ei];

    const err = rating - dot(pu, qi);
    totalLoss += err * err;

    for (let k = 0; k < N_FACTORS; k++) {
      const puOld = pu[k];
      pu[k] += LR * (err * qi[k] - REG * pu[k]);
      qi[k] += LR * (err * puOld  - REG * qi[k]);
    }
  }

  trainLoss = Math.sqrt(totalLoss / ratings.length);
  if (epoch % 5 === 0 || epoch === 1) {
    console.log(`  Epoch ${String(epoch).padStart(2)}/${N_EPOCHS}   RMSE: ${trainLoss.toFixed(4)}`);
  }
}

// Evaluate Precision and Recall
console.log('\nEvaluating...');

const userRatings = {};
ratings.forEach(r => {
  if (!userRatings[r.userId]) userRatings[r.userId] = {};
  userRatings[r.userId][r.eventId] = r.rating;
});

const sampleUsers = userIds.filter((_, i) => i % 10 === 0);
let totalP = 0, totalR = 0, nEval = 0;

for (const uid of sampleUsers) {
  const urMap = userRatings[uid] || {};
  const eids  = Object.keys(urMap);
  if (eids.length < 5) continue;

  const split    = Math.floor(eids.length * 0.8);
  const testEids = eids.slice(split);
  const trueCats = new Set(
    testEids.filter(e => urMap[e] >= 3.0).map(e => eventCat[e]).filter(Boolean)
  );
  if (!trueCats.size) continue;

  const ui = userIdx[uid];
  const catScore = {}, catCount = {};
  eventIds.forEach(eid => {
    const ei = eventIdx[eid], cat = eventCat[eid];
    if (!cat) return;
    const s = dot(P[ui], Q[ei]);
    catScore[cat] = (catScore[cat] || 0) + s;
    catCount[cat] = (catCount[cat] || 0) + 1;
  });

  const top3 = Object.entries(catScore)
    .map(([c, s]) => [c, s / catCount[c]])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  const hits = top3.filter(c => trueCats.has(c)).length;
  totalP += hits / 3;
  totalR += hits / trueCats.size;
  nEval++;
}

const p3 = totalP / nEval;
const r3 = totalR / nEval;

// Save model weights
const modelData = {
  meta: {
    algorithm      : 'Matrix Factorization (SGD)',
    nFactors       : N_FACTORS,
    nEpochs        : N_EPOCHS,
    learningRate   : LR,
    regularisation : REG,
    nUsers,
    nEvents,
    trainingSamples: ratings.length,
    finalRMSE      : parseFloat(trainLoss.toFixed(4)),
    precisionAt3   : parseFloat(p3.toFixed(4)),
    recallAt3      : parseFloat(r3.toFixed(4)),
    trainedAt      : new Date().toISOString(),
  },
  userIds,
  eventIds,
  userIdx,
  eventIdx,
  P,
  Q,
  eventCat,
};

fs.writeFileSync(MODEL_PATH, JSON.stringify(modelData));
const sizeKB = (fs.statSync(MODEL_PATH).size / 1024).toFixed(1);

console.log(`\n${'='.repeat(52)}`);
console.log('  MODEL TRAINED SUCCESSFULLY');
console.log(`${'='.repeat(52)}`);
console.log(`  Algorithm      : Matrix Factorization (SGD)`);
console.log(`  Latent Factors : ${N_FACTORS}`);
console.log(`  Epochs         : ${N_EPOCHS}`);
console.log(`  Final RMSE     : ${trainLoss.toFixed(4)}`);
console.log(`  Precision@3    : ${(p3 * 100).toFixed(1)}%`);
console.log(`  Recall@3       : ${(r3 * 100).toFixed(1)}%`);
console.log(`  Saved to       : ml/model_weights.json  (${sizeKB} KB)`);
console.log(`${'='.repeat(52)}\n`);