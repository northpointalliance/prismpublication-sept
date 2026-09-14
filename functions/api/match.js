// Public endpoint: POST /api/match
// Runs the same cosine-similarity matcher used elsewhere on this site
// (js/demo.js, sdk/prismClient.js) against the live pool of *approved*
// submissions in D1, instead of a static catalog file or a fixed script.
// This is what /run-ads/ calls so an advertiser can type a real question
// and see whether their own approved creative comes up.

const THRESHOLD = 0.65;

const STOP = {
  any: 1, the: 1, and: 1, for: 1, you: 1, can: 1, so: 1, through: 1,
  what: 1, is: 1, in: 1, need: 1, help: 1, me: 1, this: 1, that: 1,
  with: 1, from: 1, your: 1, our: 1, are: 1, was: 1, have: 1,
};

// Light stemming so "sleeping" matches "sleep", "bands" matches "band", etc.
// A real product might use a proper stemmer; this is deliberately simple.
function stem(word) {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP[word])
    .map(stem);
}

function vector(tokens) {
  const vec = {};
  for (const t of tokens) vec[t] = (vec[t] || 0) + 1;
  return vec;
}

function cosine(a, b) {
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected JSON body." }, 400);
  }

  const topic = String(body.topic || "").trim();
  if (!topic) {
    return json({ error: "Missing topic." }, 400);
  }
  if (topic.length > 400) {
    return json({ error: "Topic is too long." }, 400);
  }

  const { results } = await env.DB.prepare(
    `SELECT id, brand, category, title, description, destination_url, cta_text, keywords
     FROM ad_submissions
     WHERE status = 'approved'`
  ).all();

  if (!results.length) {
    return json({ ad: null });
  }

  const queryVec = vector(tokenize(topic));
  let best = null;
  let bestScore = 0;

  for (const row of results) {
    const corpus = `${row.category} ${row.title} ${row.description} ${row.keywords || ""}`;
    const score = cosine(queryVec, vector(tokenize(corpus)));
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }

  if (!best || bestScore < THRESHOLD) {
    return json({ ad: null });
  }

  return json({
    ad: {
      brand: best.brand,
      title: best.title,
      description: best.description,
      destinationUrl: best.destination_url,
      ctaText: best.cta_text,
    },
  });
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
