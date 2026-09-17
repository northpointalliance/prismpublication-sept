// Public endpoint: GET /c/:id?s=sessionId
// Card-click redirect for the /run-ads chat: logs the click, deducts one
// click's cost from the ad's prepaid credit (Stage 5), then sends the
// visitor to the advertiser's destination_url. Cards never link straight
// to the destination so every click can be counted and billed.

import { hashIp } from "../api/_lib/hash.js";
import { PRICE_PER_CLICK_CENTS } from "../api/_lib/pricing.js";

export async function onRequestGet(context) {
  const { request, env, params } = context;

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return new Response("Invalid ad id.", { status: 400 });
  }

  const { results } = await env.DB.prepare(
    `SELECT destination_url FROM ad_submissions WHERE id = ? AND status = 'approved' AND credit_active = 1`
  )
    .bind(id)
    .all();

  const ad = results[0];
  if (!ad) {
    return Response.redirect(new URL("/run-ads/", request.url).toString(), 302);
  }

  const sessionId = new URL(request.url).searchParams.get("s") || "";
  const ipHash = await hashIp(env, request);

  await env.DB.prepare(
    `INSERT INTO chat_events (kind, session_id, ip_hash, matched_ad_id)
     VALUES ('click', ?, ?, ?)`
  )
    .bind(sessionId.slice(0, 100), ipHash, id)
    .run();

  await env.DB.prepare(
    `INSERT INTO credit_ledger (ad_submission_id, kind, amount_cents, note)
     VALUES (?, 'click', ?, 'Card click')`
  )
    .bind(id, -PRICE_PER_CLICK_CENTS)
    .run();

  const { results: balanceRows } = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) AS balance FROM credit_ledger WHERE ad_submission_id = ?`
  )
    .bind(id)
    .all();
  const balance = balanceRows[0]?.balance ?? 0;

  if (balance < PRICE_PER_CLICK_CENTS) {
    // Not enough left to cover another click -- stop showing it now rather
    // than spend into a larger negative balance one click at a time.
    await env.DB.prepare(`UPDATE ad_submissions SET credit_active = 0 WHERE id = ?`).bind(id).run();
  }

  return Response.redirect(ad.destination_url, 302);
}
