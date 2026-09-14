// Admin endpoint: PATCH /api/submissions/:id
// Approve or reject a submission. Restricted with Cloudflare Access in the
// dashboard, same as /api/submissions -- see docs/publisher-key.md.
// Approving here does NOT add the creative to sdk/catalog.json. That file is
// still edited and deployed by hand; this just replaces "read an email" with
// a reviewable queue.

const ALLOWED_STATUSES = new Set(["approved", "rejected", "needs_review", "auto_cleared"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPatch(context) {
  const { request, env, params } = context;

  if (!request.headers.get("cf-access-authenticated-user-email")) {
    return json({ error: "Not authorized." }, 403);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return json({ error: "Invalid id." }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected JSON body." }, 400);
  }

  const status = String(body.status || "");
  if (!ALLOWED_STATUSES.has(status)) {
    return json({ error: `status must be one of: ${[...ALLOWED_STATUSES].join(", ")}` }, 400);
  }
  const reviewNotes = body.reviewNotes != null ? String(body.reviewNotes) : null;

  const result = await env.DB.prepare(
    `UPDATE ad_submissions SET status = ?, review_notes = ? WHERE id = ?`
  )
    .bind(status, reviewNotes, id)
    .run();

  if (!result.meta.changes) {
    return json({ error: "No submission with that id." }, 404);
  }

  return json({ ok: true });
}
