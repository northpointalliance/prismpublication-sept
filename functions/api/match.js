// Public endpoint: POST /api/match
// Advertiser self-test: runs the shared matcher (functions/api/_lib/matcher.js)
// against the live pool of *approved* submissions in D1, so an advertiser can
// type a real question and see whether their own approved creative comes up.
// The visitor-facing chat at /api/chat uses the same matcher.

import { findBestAd } from "./_lib/matcher.js";

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

  const { ad } = await findBestAd(env, topic, [], { requireActive: false });
  if (!ad) {
    return json({ ad: null });
  }

  return json({
    ad: {
      brand: ad.brand,
      title: ad.title,
      description: ad.description,
      destinationUrl: ad.destination_url,
      ctaText: ad.cta_text,
      isAffiliate: ad.source === "affiliate",
    },
  });
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
