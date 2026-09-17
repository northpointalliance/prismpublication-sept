// Public endpoint: POST /api/test-ad
// Saves a (possibly hand-edited) draft ad as the visitor's private test ad,
// replacing any previous one for this session -- one active test ad per
// session keeps this simple. Called after /api/draft-ad suggests a
// starting point, or with hand-typed fields if someone skips that step.
// Test ads are scored in /api/chat (_lib/matcher.js) alongside the public
// pool but are never visible to, or returned for, any other session.

const EXPIRY_DAYS = 7;

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

  const sessionId = String(body.sessionId || "").trim().slice(0, 100);
  const brand = String(body.brand || "").trim().slice(0, 80);
  const title = String(body.title || "").trim().slice(0, 80);
  const description = String(body.description || "").trim().slice(0, 200);
  const ctaText = String(body.ctaText || "").trim().slice(0, 30) || "Learn more";
  const category = String(body.category || "").trim().slice(0, 60);
  const sourceUrl = String(body.sourceUrl || "").trim().slice(0, 500);

  if (!sessionId) return json({ error: "Missing sessionId." }, 400);
  if (!brand || !title || !description) {
    return json({ error: "Brand, title, and description are required." }, 400);
  }
  if (!/^https:\/\//i.test(sourceUrl)) {
    return json({ error: "Missing the product URL -- draft an ad from a URL first." }, 400);
  }

  // Lazy cleanup of expired drafts -- no separate cleanup Worker at this traffic level.
  await env.DB.prepare(`DELETE FROM test_ads WHERE expires_at < datetime('now')`).run();
  await env.DB.prepare(`DELETE FROM test_ads WHERE session_id = ?`).bind(sessionId).run();

  await env.DB.prepare(
    `INSERT INTO test_ads (expires_at, session_id, source_url, brand, title, description, cta_text, category, destination_url)
     VALUES (datetime('now', '+${EXPIRY_DAYS} days'), ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(sessionId, sourceUrl, brand, title, description, ctaText, category || null, sourceUrl)
    .run();

  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
