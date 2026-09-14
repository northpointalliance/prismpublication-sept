// Admin endpoint: GET /api/submissions
// Lists ad submissions for review. This route (and /admin/) must be
// restricted with Cloudflare Access in the dashboard -- see
// docs/publisher-key.md for the one-time setup steps. The header check below
// is defense in depth, not the primary access control.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!request.headers.get("cf-access-authenticated-user-email")) {
    return json({ error: "Not authorized." }, 403);
  }

  const { results } = await env.DB.prepare(
    `SELECT id, created_at, status, brand, email, category, title, description,
            destination_url, cta_text, budget_note, review_notes
     FROM ad_submissions
     ORDER BY created_at DESC`
  ).all();

  return json({ submissions: results });
}
