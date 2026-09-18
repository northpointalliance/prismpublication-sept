// Admin endpoint: POST /api/submissions/:id/house-credit
// Grants a no-charge credit balance so an approved campaign goes live
// without a real PayPal purchase -- for the site owner's own inventory.
// Added 18 September 2026: Daniel wanted to run his own site
// (devorahsart.com) as a sponsored card without buying credit from
// himself. Access-gated, same defense-in-depth pattern as the sibling
// functions/api/submissions/[id].js.
//
// From here on this behaves exactly like a real prepaid credit
// purchase: same credit_ledger, same per-click draw-down in
// functions/c/[id].js, same automatic stop if the balance ever runs
// out. There's just no PayPal capture behind this one ledger row --
// the note field says so, so /admin/ and the ledger stay honest about
// which campaigns actually paid and which didn't.

import { MIN_CREDIT_PURCHASE_CENTS, MAX_CREDIT_PURCHASE_CENTS } from "../../_lib/pricing.js";

const DEFAULT_HOUSE_CREDIT_CENTS = 5000; // $50 -- a deliberately generous default for house inventory

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env, params } = context;

  if (!request.headers.get("cf-access-authenticated-user-email")) {
    return json({ error: "Not authorized." }, 403);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return json({ error: "Invalid id." }, 400);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine -- the default amount below applies.
  }

  const requested = Number(body.amountCents);
  const amountCents = Number.isInteger(requested) && requested > 0 ? requested : DEFAULT_HOUSE_CREDIT_CENTS;
  if (amountCents < MIN_CREDIT_PURCHASE_CENTS || amountCents > MAX_CREDIT_PURCHASE_CENTS) {
    return json(
      { error: `amountCents must be between ${MIN_CREDIT_PURCHASE_CENTS} and ${MAX_CREDIT_PURCHASE_CENTS}.` },
      400
    );
  }

  const { results } = await env.DB.prepare(`SELECT id, status FROM ad_submissions WHERE id = ?`)
    .bind(id)
    .all();
  const ad = results[0];
  if (!ad) return json({ error: "No submission with that id." }, 404);
  if (ad.status !== "approved") {
    return json({ error: "Only an approved submission can go live." }, 409);
  }

  await env.DB.prepare(
    `INSERT INTO credit_ledger (ad_submission_id, kind, amount_cents, note)
     VALUES (?, 'purchase', ?, 'House credit -- no PayPal charge, owner-operated inventory')`
  )
    .bind(id, amountCents)
    .run();

  await env.DB.prepare(`UPDATE ad_submissions SET credit_active = 1 WHERE id = ?`).bind(id).run();

  const { results: balanceRows } = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) AS balance FROM credit_ledger WHERE ad_submission_id = ?`
  )
    .bind(id)
    .all();

  return json({ ok: true, balanceCents: balanceRows[0]?.balance ?? 0 });
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
