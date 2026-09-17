// Shared PayPal helpers. Filename starts with "_" so Cloudflare Pages does
// not treat it as a route -- it's only imported by the actual endpoints.
// Requires PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET as Cloudflare Pages
// secrets (Settings -> Environment variables -> Secret). PAYPAL_MODE
// ("sandbox" | "live") is optional, defaults to "sandbox" -- flip it when
// ready to take real money, no code change needed.
//
// Generalized for Stage 5 (credit packs, variable amount) -- submitting a
// campaign is free now, so the fixed $5.00 order this used to always
// create no longer applies anywhere. createOrder/captureOrder take/return
// a plain amount; the caller (functions/api/credit/purchase.js) is
// responsible for checking the captured amount is one of the allowed
// credit packs in _lib/pricing.js, since this file has no opinion on
// what a valid amount is.

export function paypalBaseUrl(env) {
  return env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

// Cloudflare env var values can end up with a stray trailing newline or
// whitespace depending on how they were copy-pasted into the dashboard --
// confirmed happening here (PAYPAL_CLIENT_ID had a literal trailing \n,
// which silently breaks the Basic Auth header PayPal rejects as
// invalid_client). Trim defensively rather than relying on a clean paste.
function clean(value) {
  return String(value || "").trim();
}

export async function getAccessToken(env) {
  const base = paypalBaseUrl(env);
  const auth = btoa(`${clean(env.PAYPAL_CLIENT_ID)}:${clean(env.PAYPAL_CLIENT_SECRET)}`);
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

export async function createOrder(env, { amountCents, description }) {
  const base = paypalBaseUrl(env);
  const token = await getAccessToken(env);
  const value = (amountCents / 100).toFixed(2);
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          amount: { currency_code: "USD", value },
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal create order failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.id;
}

// Captures the order and returns { ok, amountCents } for whatever amount
// was actually paid -- this file doesn't know what amount is "expected",
// the caller checks amountCents against its own allowed values. Throws
// only on a genuine network/API error; a declined payment or one that
// never completed returns { ok: false }, it doesn't throw.
export async function captureOrder(env, orderId) {
  const base = paypalBaseUrl(env);
  const token = await getAccessToken(env);
  const res = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    return { ok: false, reason: `capture request failed (${res.status})` };
  }
  if (data.status !== "COMPLETED") {
    return { ok: false, reason: `order status is ${data.status}, not COMPLETED` };
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture || capture.status !== "COMPLETED") {
    return { ok: false, reason: "no completed capture found on order" };
  }

  const amount = capture.amount;
  if (amount?.currency_code !== "USD") {
    return { ok: false, reason: `unexpected currency: ${amount?.currency_code}` };
  }

  return { ok: true, amountCents: Math.round(Number(amount.value) * 100) };
}
