// Public endpoint: POST /api/submit
// Receives an advertiser's creative, verifies the $5 PayPal payment for it,
// and stores it in D1 for manual review. Category is free text -- there is
// no automated category whitelist. A person reviews every submission
// against the brand-safety rules on the ad-submission page before it can
// go live; this endpoint only removes the manual "read an email" step, it
// does not put anything live on its own.

import { captureOrder } from "./paypal/_shared.js";

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

  const paypalOrderId = String(body.paypalOrderId || "").trim();
  if (!paypalOrderId) {
    return json({ error: "Missing paypalOrderId. Payment must complete before submitting." }, 400);
  }

  let capture;
  try {
    capture = await captureOrder(env, paypalOrderId);
  } catch {
    return json({ error: "Could not verify payment with PayPal right now. Try again in a moment." }, 502);
  }
  if (!capture.ok) {
    return json({ error: `Payment could not be verified: ${capture.reason}` }, 402);
  }

  await env.DB.prepare(
    `INSERT INTO ad_submissions
      (brand, email, category, title, description, destination_url, cta_text, budget_note, keywords, paypal_order_id, amount_paid_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(brand, email, category, title, description, destinationUrl, ctaText, budgetNote || null, keywords || null, paypalOrderId, capture.amountCents)
    .run();

  return json({
    ok: true,
    message: "Submitted. A person reviews every campaign against the brand-safety rules before it can run.",
  });
}

export async function onRequestGet() {
  return json({ error: "Use POST to submit a campaign." }, 405);
}
