// sdk/prismClient.js
// Server-side REST client for Prism's live API.
// Auth is Bearer <key> (master or per-bot). HMAC signing is an optional extra
// layer and is not sent here. Do not import this file in a browser bundle.

const BASE_URL =
  (typeof process !== "undefined" && process.env && process.env.PRISM_API_BASE_URL) ||
  "https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api";

async function prismRequest({ apiKey, path, body }) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
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

/**
 * Fetch one labelled placement after the assistant has answered.
 * @param {{ apiKey: string, botId: string, topic: string, userId?: string, format?: "text"|"card"|"banner" }} opts
 */
export async function displayAd({ apiKey, botId, topic, userId, format = "card" }) {
  const data = await prismRequest({
    apiKey,
    path: "/ads",
    body: {
      botId,
      context: { topic, userId },
      format,
    },
  });
  return firstAd(data);
}

export async function trackImpression({ apiKey, botId, adId, userId }) {
  return prismRequest({
    apiKey,
    path: "/track/impression",
    body: { botId, adId, userId },
  });
}

export async function trackClick({ apiKey, botId, adId, userId }) {
  return prismRequest({
    apiKey,
    path: "/track/click",
    body: { botId, adId, userId },
  });
}
