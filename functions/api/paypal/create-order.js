// Public endpoint: POST /api/paypal/create-order
// Creates a PayPal order for an advertiser-chosen credit amount -- the
// advertiser sets their own budget, not a fixed pack. The amount is
// still never trusted blindly: it's re-validated server-side against the
// same min/max in _lib/pricing.js before creating the order, and
// credit/purchase.js re-checks it again against the actual PayPal
// capture before crediting anything. Used only for buying ad-credit
// (Stage 5); submitting a campaign is free and never calls this.

import { createOrder } from "./_shared.js";
import { MIN_CREDIT_PURCHASE_CENTS, MAX_CREDIT_PURCHASE_CENTS, formatUsd } from "../_lib/pricing.js";

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

  const amountCents = Number(body.amountCents);
  if (
    !Number.isInteger(amountCents) ||
    amountCents < MIN_CREDIT_PURCHASE_CENTS ||
    amountCents > MAX_CREDIT_PURCHASE_CENTS
  ) {
    return json(
      { error: `Amount must be between ${formatUsd(MIN_CREDIT_PURCHASE_CENTS)} and ${formatUsd(MAX_CREDIT_PURCHASE_CENTS)}.` },
      400
    );
  }

  try {
    const orderId = await createOrder(env, {
      amountCents,
      description: `Prism Publication ad credit -- ${formatUsd(amountCents)}`,
    });
    return json({ orderId });
  } catch (err) {
    return json({ error: "Could not start PayPal checkout. Try again in a moment." }, 502);
  }
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
