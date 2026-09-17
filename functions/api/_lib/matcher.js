// Shared cosine-similarity matcher against the live D1 ad_submissions pool.
// Used by both /api/match (advertiser self-test) and /api/chat (visitor chat).
// Not embeddings -- deliberately simple bag-of-words term frequency, stemmed.
// A real product might use a proper stemmer or vector search; this is what
// clears the 0.65 floor on realistic queries today, and it's fast and free.

export const MATCH_THRESHOLD = 0.65;

const STOP = {
  any: 1, the: 1, and: 1, for: 1, you: 1, can: 1, so: 1, through: 1,
  what: 1, is: 1, in: 1, need: 1, help: 1, me: 1, this: 1, that: 1,
  with: 1, from: 1, your: 1, our: 1, are: 1, was: 1, have: 1,
};

function stem(word) {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP[word])
    .map(stem);
}

export function vector(tokens) {
  const vec = {};
  for (const t of tokens) vec[t] = (vec[t] || 0) + 1;
  return vec;
}

export function cosine(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (const key in a) if (Object.hasOwn(a, key)) magA += a[key] * a[key];
  for (const key in b) {
    if (Object.hasOwn(b, key)) {
      magB += b[key] * b[key];
      if (a[key]) dot += a[key] * b[key];
    }
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function scoreAd(topic, row) {
  const corpus = `${row.category || ""} ${row.title} ${row.description} ${row.keywords || ""}`;
  return cosine(vector(tokenize(topic)), vector(tokenize(corpus)));
}

// Returns { ad, score } where ad is the raw row (or null) and score is the
// winning cosine similarity (0 when there's no pool or no match). extraRows
// (same shape as an ad_submissions row) are scored alongside the public
// approved pool but never stored or shown outside the caller's own session
// -- used for a visitor's private draft/test ad (see draft-ad.js).
export async function findBestAd(env, topic, extraRows = []) {
  const { results } = await env.DB.prepare(
    `SELECT id, brand, category, title, description, destination_url, cta_text, keywords
     FROM ad_submissions
     WHERE status = 'approved'`
  ).all();

  const pool = [...results, ...extraRows];
  if (!pool.length) return { ad: null, score: 0 };

  let best = null;
  let bestScore = 0;

  for (const row of pool) {
    const score = scoreAd(topic, row);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }

  if (!best || bestScore < MATCH_THRESHOLD) return { ad: null, score: bestScore };
  return { ad: best, score: bestScore };
}
