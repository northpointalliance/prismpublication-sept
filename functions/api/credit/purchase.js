// Public endpoint: POST /api/credit/purchase
// Buys a credit pack for an approved campaign, identified by its access
// token (see functions/campaign/[token].js) -- no account system, no
// login, the token is the only key. Verifies the PayPal capture amount
// against the fixed packs in _lib/pricing.js before crediting anything;
// the client only ever picks which pack, never sends an amount that's
// trusted directly.

import { captureOrder } from "../paypal/_shared.js";
import { CREDIT_PACKS_CENTS } from "../_lib/pricing.js";

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

  const token = String(body.token || "").trim();
  const paypalOrderId = String(body.paypalOrderId || "").trim();
  if (!token || !paypalOrderId) {
    return json({ error: "Missing token or paypalOrderId." }, 400);
  }

  const { results } = await env.DB.prepare(
    `SELECT id, status FROM ad_submissions WHERE access_token = ?`
  )
    .bind(token)
    .all();
  const ad = results[0];
  if (!ad) {
    return json({ error: "Campaign not found." }, 404);
  }
  if (ad.status !== "approved") {
    return json({ error: "This campaign isn't approved yet, so credit can't be bought for it." }, 409);
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
  if (!CREDIT_PACKS_CENTS.includes(capture.amountCents)) {
    return json({ error: `Unexpected paid amount: ${capture.amountCents} cents.` }, 402);
  }

  await env.DB.prepare(
    `INSERT INTO credit_ledger (ad_submission_id, kind, amount_cents, paypal_order_id, note)
     VALUES (?, 'purchase', ?, ?, 'Credit pack purchase')`
  )
    .bind(ad.id, capture.amountCents, paypalOrderId)
    .run();

  await env.DB.prepare(`UPDATE ad_submissions SET credit_active = 1 WHERE id = ?`).bind(ad.id).run();

  const { results: balanceRows } = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) AS balance FROM credit_ledger WHERE ad_submission_id = ?`
  )
    .bind(ad.id)
    .all();

  return json({ ok: true, balanceCents: balanceRows[0]?.balance ?? 0 });
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
