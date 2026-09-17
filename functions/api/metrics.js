// Admin endpoint: GET /api/metrics
// Funnel and revenue numbers for /admin/metrics/, computed live from tables
// that already exist for other reasons (chat_events, test_ads,
// ad_submissions, credit_ledger) -- no rollup table and no scheduled
// Worker, since traffic doesn't come close to needing one yet. This route
// must be restricted with Cloudflare Access in the dashboard, same as
// /admin/ and /api/submissions -- the header check below is defense in
// depth, not the primary access control.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function windowStats(env, days) {
  const since = `-${days} days`;

  const [pageViews, chatSessions, chatTurns, matchedTurns, testAdsCreated, submissions, approved, creditPurchases, clicks] =
    await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS n FROM chat_events WHERE kind = 'page_view' AND created_at > datetime('now', ?)`).bind(since).first("n"),
      env.DB.prepare(`SELECT COUNT(DISTINCT session_id) AS n FROM chat_events WHERE kind = 'chat' AND created_at > datetime('now', ?)`).bind(since).first("n"),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM chat_events WHERE kind = 'chat' AND created_at > datetime('now', ?)`).bind(since).first("n"),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM chat_events WHERE kind = 'chat' AND matched_ad_id IS NOT NULL AND created_at > datetime('now', ?)`).bind(since).first("n"),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM test_ads WHERE created_at > datetime('now', ?)`).bind(since).first("n"),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM ad_submissions WHERE created_at > datetime('now', ?)`).bind(since).first("n"),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM ad_submissions WHERE status = 'approved' AND created_at > datetime('now', ?)`).bind(since).first("n"),
      env.DB.prepare(`SELECT COUNT(DISTINCT ad_submission_id) AS sessions, COALESCE(SUM(amount_cents), 0) AS cents FROM credit_ledger WHERE kind = 'purchase' AND created_at > datetime('now', ?)`).bind(since).first(),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM chat_events WHERE kind = 'click' AND created_at > datetime('now', ?)`).bind(since).first("n"),
    ]);

  return {
    pageViews,
    chatSessions,
    chatTurns,
    matchRate: chatTurns ? Number((matchedTurns / chatTurns).toFixed(3)) : null,
    testAdsCreated,
    submissions,
    approved,
    creditPurchases: creditPurchases.sessions,
    revenueCents: creditPurchases.cents,
    clicks,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!request.headers.get("cf-access-authenticated-user-email")) {
    return json({ error: "Not authorized." }, 403);
  }

  const [last7, last30] = await Promise.all([windowStats(env, 7), windowStats(env, 30)]);

  const revenueAllTime = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) AS cents FROM credit_ledger WHERE kind = 'purchase'`
  ).first("cents");

  return json({ last7, last30, revenueAllTimeCents: revenueAllTime });
}
