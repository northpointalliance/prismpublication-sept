// Public endpoint: POST /api/track
// Minimal, allowlisted event logging for the top of the funnel -- the only
// step with no natural server-side moment to log from. Everything else in
// Stage 6's dashboard (functions/api/metrics.js) is computed directly from
// tables that already exist for other reasons (chat_events, test_ads,
// ad_submissions, credit_ledger), not duplicated here.

import { hashIp } from "./_lib/hash.js";

const ALLOWED_KINDS = new Set(["page_view"]);

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

  const kind = String(body.kind || "");
  if (!ALLOWED_KINDS.has(kind)) {
    return json({ error: "Unknown event kind." }, 400);
  }

  const sessionId = String(body.sessionId || "").trim().slice(0, 100);
  const ipHash = await hashIp(env, request);

  await env.DB.prepare(`INSERT INTO chat_events (kind, session_id, ip_hash) VALUES (?, ?, ?)`)
    .bind(kind, sessionId || null, ipHash)
    .run();

  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
