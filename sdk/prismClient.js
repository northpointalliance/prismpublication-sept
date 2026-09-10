// sdk/prismClient.js
// Server-side client for Prism on Cloudflare Pages (static catalog).
// Optional GAM fan-out. Do not import this file in a browser bundle.
// There is no Supabase host and no Pages Function. No Prism-issued secret key.

import { fillFromGam, hasGamDemand } from "./gamClient.js";

const MATCH_BUDGET_MS = 120;
const THRESHOLD = 0.65;

const DEFAULT_CATALOG_URL =
  (typeof process !== "undefined" && process.env && process.env.PRISM_CATALOG_URL) ||
  "https://prismpublication.com/sdk/catalog.json";

const STOP = {
  any: 1, the: 1, and: 1, for: 1, you: 1, can: 1, so: 1, through: 1,
  what: 1, is: 1, in: 1, need: 1, help: 1, me: 1, this: 1, that: 1,
  with: 1, from: 1, your: 1, our: 1, are: 1, was: 1, have: 1
};

const EXPAND = {
  protein: ["protein", "powder", "whey", "supplement", "training"],
  powder: ["protein", "powder", "whey"],
  lifting: ["lifting", "gym", "training", "fitness", "workout"],
  gym: ["gym", "fitness", "training", "workout"],
  running: ["running", "run", "cardio", "watch", "pace"],
  sleep: ["sleep", "night", "rest", "bedtime"],
  machine: ["sound", "machine", "sleep"],
  notes: ["notes", "docs", "organize", "workspace"],
  emails: ["email", "draft", "docs", "productivity"],
  organize: ["organize", "notes", "docs", "workspace", "productivity"],
  packing: ["packing", "cubes", "carry", "luggage", "bag", "travel"],
  cubes: ["packing", "cubes", "carry", "bag"],
  adapter: ["adapter", "plug", "hotel", "travel", "outlet"]
};

let catalogCache = null;

function tokenize(value) {
  const raw = String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(function (word) {
      return word.length > 2 && !STOP[word];
    });
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const extra = EXPAND[raw[i]];
    if (extra) extra.forEach(function (w) { out.push(w); });
    else out.push(raw[i]);
  }
  return out;
}

function vector(tokens) {
  const vec = {};
  for (let i = 0; i < tokens.length; i++) {
    vec[tokens[i]] = (vec[tokens[i]] || 0) + 1;
  }
  return vec;
}

function cosine(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  let key;
  for (key in a) {
    if (Object.prototype.hasOwnProperty.call(a, key)) magA += a[key] * a[key];
  }
  for (key in b) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      magB += b[key] * b[key];
      if (a[key]) dot += a[key] * b[key];
    }
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function asCard(ad) {
  if (!ad || !ad.title || !ad.clickUrl || !ad.advertiser) return null;
  return {
    source: "prism",
    id: ad.id || null,
    title: ad.title,
    description: ad.description || "",
    url: ad.clickUrl,
    ctaText: ad.ctaText || "Learn more",
    advertiser: ad.advertiser,
    affiliate: Boolean(ad.affiliate),
    niche: ad.niche || ""
  };
}

function matchAds(topic, ads, niche) {
  const queryVec = vector(tokenize(topic));
  const pool = (ads || []).filter(function (ad) {
    return !niche || ad.niche === niche;
  });
  let best = null;
  let bestScore = 0;
  for (let i = 0; i < pool.length; i++) {
    const ad = pool[i];
    const score = cosine(
      queryVec,
      vector(tokenize([ad.title, ad.description, ad.tokens].join(" ")))
    );
    if (score > bestScore) {
      bestScore = score;
      best = ad;
    }
  }
  if (!topic || !best || bestScore < THRESHOLD) return null;
  return asCard(best);
}

async function loadCatalog(opts, signal) {
  if (opts && Array.isArray(opts.ads)) return { ads: opts.ads };
  if (opts && opts.catalog && Array.isArray(opts.catalog.ads)) return opts.catalog;
  if (catalogCache) return catalogCache;
  const url = (opts && opts.catalogUrl) || DEFAULT_CATALOG_URL;
  const res = await fetch(url, { signal: signal });
  if (!res.ok) throw new Error("catalog " + res.status);
  const data = await res.json();
  if (!data || !Array.isArray(data.ads)) throw new Error("catalog shape");
  catalogCache = data;
  return data;
}

async function fillFromPrism(opts) {
  const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ac ? setTimeout(function () { ac.abort(); }, MATCH_BUDGET_MS) : null;
  try {
    const catalog = await loadCatalog(opts, ac ? ac.signal : undefined);
    return matchAds(opts.topic, catalog.ads, opts.niche);
  } catch (err) {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function pickFill(cards) {
  const valid = cards.filter(Boolean);
  const gam = valid.find(function (card) { return card.source === "gam"; });
  if (gam) return gam;
  return valid[0] || null;
}

/**
 * Fetch one labelled placement after the assistant has answered.
 * Reads the static catalog on Cloudflare Pages. Optional GAM fan-out.
 * Budget is 120ms. Miss or timeout on a leg is null. GAM wins if both fill.
 * @param {{ topic: string, botId?: string, niche?: string, userId?: string, format?: "text"|"card"|"banner", catalogUrl?: string, catalog?: object, ads?: object[], gam?: { fillUrl?: string, networkCode?: string, adUnitCode?: string } }} opts
 */
export async function displayAd(opts) {
  const request = opts || {};
  if (!request.topic) return null;
  const legs = [fillFromPrism(request)];
  if (hasGamDemand(request)) legs.push(fillFromGam(request));
  const cards = await Promise.all(legs);
  return pickFill(cards);
}

export async function trackImpression({ source }) {
  if (source === "gam") return { ok: true, source: "gam" };
  return { ok: true, source: "pages" };
}

export async function trackClick({ source }) {
  if (source === "gam") return { ok: true, source: "gam" };
  return { ok: true, source: "pages" };
}

export { MATCH_BUDGET_MS, THRESHOLD, DEFAULT_CATALOG_URL, hasGamDemand, matchAds };
