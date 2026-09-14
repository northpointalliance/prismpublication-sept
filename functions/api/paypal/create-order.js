// Public endpoint: POST /api/paypal/create-order
// Creates a $5.00 PayPal order server-side (amount is fixed here, never
// trusted from the client) and returns the order ID for the PayPal Buttons
// SDK to approve on the client.

import { createOrder } from "./_shared.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { env } = context;
  try {
    const orderId = await createOrder(env);
    return json({ orderId });
  } catch (err) {
    return json({ error: "Could not start PayPal checkout. Try again in a moment." }, 502);
  }
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
