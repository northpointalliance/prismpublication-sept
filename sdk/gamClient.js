// sdk/gamClient.js
// Server-side Google Ad Manager demand leg. Do not import in a browser bundle.
// No googletag / GPT script. Keys and network codes stay on the publisher server.

const MATCH_BUDGET_MS = 120;

function env(name) {
  if (typeof process === "undefined" || !process.env) return "";
  return String(process.env[name] || "").trim();
}

function gamConfig(opts) {
  const gam = opts && opts.gam ? opts.gam : {};
  return {
    fillUrl: String(gam.fillUrl || env("GAM_FILL_URL") || "").trim(),
    networkCode: String(gam.networkCode || env("GAM_NETWORK_CODE") || "").trim(),
    adUnitCode: String(gam.adUnitCode || env("GAM_AD_UNIT_CODE") || "").trim()
  };
}

export function hasGamDemand(opts) {
  const cfg = gamConfig(opts);
  return Boolean(cfg.fillUrl && cfg.networkCode && cfg.adUnitCode);
}

function asCard(data) {
  if (!data || typeof data !== "object") return null;
  const title = data.title || data.headline;
  const url = data.url || data.clickUrl || data.destination;
  const advertiser = data.advertiser || data.advertiserName || data.brand;
  if (!title || !url || !advertiser) return null;
  return {
    source: "gam",
    title: String(title),
    description: String(data.description || data.body || ""),
    url: String(url),
    advertiser: String(advertiser),
    adId: data.adId || data.lineItemId || data.id || null
  };
}

/**
 * Ask the publisher's GAM-connected fill URL for one labeled card.
 * Missing config, HTTP errors, and timeouts return null (fail closed).
 */
export async function fillFromGam(opts) {
  const cfg = gamConfig(opts);
  if (!cfg.fillUrl || !cfg.networkCode || !cfg.adUnitCode) return null;

  const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ac ? setTimeout(function () { ac.abort(); }, MATCH_BUDGET_MS) : null;

  try {
    const res = await fetch(cfg.fillUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ac ? ac.signal : undefined,
      body: JSON.stringify({
        networkCode: cfg.networkCode,
        adUnitCode: cfg.adUnitCode,
        format: opts.format || "card",
        targeting: {
          topic: opts.topic,
          botId: opts.botId,
          userId: opts.userId
        }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return asCard(data.ad || data.card || data);
  } catch (err) {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
