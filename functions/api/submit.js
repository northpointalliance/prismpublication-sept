// Public endpoint: POST /api/submit
// Screens the campaign, then stores it in D1 for review. Free -- Stage 5
// (docs/run-ads-strategy-2026-09-16.md) retired the $5 submission fee;
// the only charge now is prepaid click credit, bought later via the
// token-based campaign page once a submission is approved. Generates
// that access token here and returns it -- there's no account system, so
// this link is the advertiser's only way back to check status or pay.

import { screenAd } from "./_lib/screening.js";

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

  const brand = String(body.brand || "").trim();
  const email = String(body.email || "").trim();
  const category = String(body.category || "").trim().toLowerCase();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const destinationUrl = String(body.destinationUrl || "").trim();
  const ctaText = String(body.ctaText || "").trim();
  const budgetNote = String(body.budgetNote || "").trim();
  const keywords = String(body.keywords || "").trim().slice(0, 300);

  const missing = [];
  if (!brand) missing.push("brand");
  if (!email) missing.push("email");
  if (!category) missing.push("category");
  if (!title) missing.push("title");
  if (!description) missing.push("description");
  if (!destinationUrl) missing.push("destinationUrl");
  if (!ctaText) missing.push("ctaText");
  if (missing.length) {
    return json({ error: `Missing required field(s): ${missing.join(", ")}` }, 400);
  }

  if (!/^https:\/\//i.test(destinationUrl)) {
    return json({ error: "destinationUrl must be an https:// link." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "email does not look valid." }, 400);
  }

  const screening = await screenAd(env, { brand, category, title, description, keywords, destinationUrl });
  if (screening.status === "rejected") {
    return json({ error: screening.reason, rejected: true }, 422);
  }

  const accessToken = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO ad_submissions
      (status, brand, email, category, title, description, destination_url, cta_text, budget_note, review_notes, keywords, access_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(screening.status, brand, email, category, title, description, destinationUrl, ctaText, budgetNote || null, screening.reason, keywords || null, accessToken)
    .run();

  return json({
    ok: true,
    accessToken,
    message:
      screening.status === "auto_cleared"
        ? "Submitted and cleared automated review. A person still checks it before it can run."
        : "Submitted. This one needs a manual look before it can run -- usually within 2 business days.",
  });
}

export async function onRequestGet() {
  return json({ error: "Use POST to submit a campaign." }, 405);
}
