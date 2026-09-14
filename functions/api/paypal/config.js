// Public endpoint: GET /api/paypal/config
// Returns the PayPal Client ID so the static HTML can load the PayPal SDK
// script dynamically, without hardcoding it into a file that would need a
// redeploy every time the ID changes. The Client ID is meant to be public
// (it's the same value PayPal's own SDK script tag takes) -- this endpoint
// never touches PAYPAL_CLIENT_SECRET.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.PAYPAL_CLIENT_ID) {
    return json({ error: "PayPal is not configured yet." }, 503);
  }
  return json({ clientId: env.PAYPAL_CLIENT_ID });
}
