// Public endpoint: GET /api/reach
// The one number from Stage 6 that's safe to show publicly (a trust
// signal on /run-ads) -- everything else in the funnel stays behind
// Cloudflare Access at /api/metrics. Below LOW_VOLUME_FLOOR, returns
// lowVolume: true instead of the real count, so a near-zero number early
// on doesn't undermine trust instead of building it.

const LOW_VOLUME_FLOOR = 20;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM chat_events WHERE kind = 'chat' AND created_at > datetime('now', '-7 days')`
  ).first("n");

  if (count < LOW_VOLUME_FLOOR) {
    return json({ lowVolume: true });
  }
  return json({ lowVolume: false, questionsLast7Days: count });
}
