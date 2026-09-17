// Public endpoint: POST /api/paypal/create-order
// Creates a PayPal order for one of the fixed credit packs in _lib/
// pricing.js -- the amount is never trusted from the client beyond
// picking which pack, and is looked up server-side before creating the
// order. Used only for buying ad-credit (Stage 5); submitting a campaign
// is free and never calls this.

import { createOrder } from "./_shared.js";
import { CREDIT_PACKS_CENTS, formatUsd } from "../_lib/pricing.js";

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

  const packCents = Number(body.packCents);
  if (!CREDIT_PACKS_CENTS.includes(packCents)) {
    return json({ error: "Not a valid credit pack." }, 400);
  }

  try {
    const orderId = await createOrder(env, {
      amountCents: packCents,
      description: `Prism Publication ad credit -- ${formatUsd(packCents)}`,
    });
    return json({ orderId });
  } catch (err) {
    return json({ error: "Could not start PayPal checkout. Try again in a moment." }, 502);
  }
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
