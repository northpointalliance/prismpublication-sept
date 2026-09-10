// sdk/prismClient.js
// Server-side REST client for Prism's live API, with optional GAM fan-out.
// Auth is Bearer <key> (master or per-bot). HMAC signing is an optional extra
// layer and is not sent here. Do not import this file in a browser bundle.

import { fillFromGam, hasGamDemand } from "./gamClient.js";

const MATCH_BUDGET_MS = 120;

const BASE_URL =
  (typeof process !== "undefined" && process.env && process.env.PRISM_API_BASE_URL) ||
  "https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api";

async function prismRequest({ apiKey, path, body, signal }) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: signal
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Prism API error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

function firstAd(data) {
  return data?.data?.[0] ?? data?.ad ?? data ?? null;
}

function asPrismCard(data) {
  if (!data || typeof data !== "object") return null;
  if (data.raw && !data.title && !data.ad) return null;
  return Object.assign({ source: "prism" }, data);
}

async function fillFromPrism(opts) {
  if (!opts.apiKey) return null;
  const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ac ? setTimeout(function () { ac.abort(); }, MATCH_BUDGET_MS) : null;
  try {
    const data = await prismRequest({
      apiKey: opts.apiKey,
      path: "/ads",
      signal: ac ? ac.signal : undefined,
      body: {
        botId: opts.botId,
        context: { topic: opts.topic, userId: opts.userId },
        format: opts.format || "card"
      }
    });
    return asPrismCard(firstAd(data));
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
 * Fans out to Prism and, when configured, Google Ad Manager in parallel.
 * Budget is 120ms. Miss or timeout on a leg is null. GAM wins if both fill.
 * @param {{ apiKey: string, botId: string, topic: string, userId?: string, format?: "text"|"card"|"banner", gam?: { fillUrl?: string, networkCode?: string, adUnitCode?: string } }} opts
 */
export async function displayAd(opts) {
  const request = opts || {};
  const legs = [fillFromPrism(request)];
  if (hasGamDemand(request)) legs.push(fillFromGam(request));
  const cards = await Promise.all(legs);
  return pickFill(cards);
}

export async function trackImpression({ apiKey, botId, adId, userId, source }) {
  if (source === "gam") return { ok: true, source: "gam" };
  return prismRequest({
    apiKey,
    path: "/track/impression",
    body: { botId, adId, userId },
  });
}

export async function trackClick({ apiKey, botId, adId, userId, source }) {
  if (source === "gam") return { ok: true, source: "gam" };
  return prismRequest({
    apiKey,
    path: "/track/click",
    body: { botId, adId, userId },
  });
}

export { MATCH_BUDGET_MS, hasGamDemand };
