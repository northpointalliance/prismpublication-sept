// TEMPORARY DIAGNOSTIC VERSION -- self-contained, no import from _shared.js,
// to isolate whether the 502 is an import/bundling issue or a fetch-to-PayPal
// issue. Revert to the real implementation once diagnosed.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { env } = context;
  try {
    const hasClientId = typeof env.PAYPAL_CLIENT_ID === "string" && env.PAYPAL_CLIENT_ID.length > 0;
    const hasSecret = typeof env.PAYPAL_CLIENT_SECRET === "string" && env.PAYPAL_CLIENT_SECRET.length > 0;

    if (!hasClientId || !hasSecret) {
      return json({ step: "env-check", hasClientId, hasSecret }, 200);
    }

    const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
    const res = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const text = await res.text();
    return json({ step: "fetch-complete", status: res.status, bodyPreview: text.slice(0, 300) }, 200);
  } catch (err) {
    return json({ step: "caught-exception", message: String(err && err.message || err), stack: String(err && err.stack || "") }, 200);
  }
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
