// Public endpoint: POST /api/submit
// Receives an advertiser's creative, checks it against the approved category
// list from docs/ad-submission.md, and stores it in D1. Auto-cleared
// submissions still wait for a human to actually add them to sdk/catalog.json
// -- this endpoint only removes the manual "read an email" step, it does not
// put anything live on its own.

const APPROVED_CATEGORIES = new Set(["fitness", "sleep", "productivity"]);

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

  const brand = String(body.brand || "").trim();
  const email = String(body.email || "").trim();
  const category = String(body.category || "").trim().toLowerCase();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const destinationUrl = String(body.destinationUrl || "").trim();
  const ctaText = String(body.ctaText || "").trim();
  const budgetNote = String(body.budgetNote || "").trim();

  const missing = [];
  if (!brand) missing.push("brand");
  if (!email) missing.push("email");
  if (!category) missing.push("category");
  if (!title) missing.push("title");
  if (!description) missing.push("description");
  if (!destinationUrl) missing.push("destinationUrl");
  if (!ctaText) missing.push("ctaText");
  if (missing.length) {
    return json({ error: `Missing required field(s): ${missing.join(", ")}` }, 400);
  }

  if (!/^https:\/\//i.test(destinationUrl)) {
    return json({ error: "destinationUrl must be an https:// link." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "email does not look valid." }, 400);
  }

  const status = APPROVED_CATEGORIES.has(category) ? "auto_cleared" : "needs_review";

  await env.DB.prepare(
    `INSERT INTO ad_submissions
      (status, brand, email, category, title, description, destination_url, cta_text, budget_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(status, brand, email, category, title, description, destinationUrl, ctaText, budgetNote || null)
    .run();

  return json({
    ok: true,
    status,
    message:
      status === "auto_cleared"
        ? "Category is pre-approved. A person still reviews the creative before it goes live."
        : "This category needs manual review before anything can run.",
  });
}

export async function onRequestGet() {
  return json({ error: "Use POST to submit a campaign." }, 405);
}
