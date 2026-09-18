// Public endpoint: GET /c/:id?s=sessionId
// Card-click redirect for the /run-ads chat: logs the click, deducts one
// click's cost from the ad's prepaid credit (Stage 5), then sends the
// visitor to the advertiser's destination_url. Cards never link straight
// to the destination so every click can be counted and billed.
//
// Click-fraud guard (18 September 2026): a click is only billable if this
// exact session actually got this exact ad served by /api/chat first
// (chat_events has a 'chat' row with this session_id + matched_ad_id).
// That blocks a cold hit on this URL, curl, a scraper, a guessed id, with
// no real chat turn behind it. A session can only bill one click per ad
// ever, so a refresh, double-tap, or back-button resubmit on the same
// card doesn't charge twice. Neither check blocks the redirect itself --
// the visitor always reaches the advertiser's page; only billing is
// gated. This doesn't stop a determined attacker scripting fresh
// sessionIds through real chat turns, but /api/chat's own per-IP rate
// limits already cap how many of those one IP can generate per day.

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

  const sessionId = String(new URL(request.url).searchParams.get("s") || "").slice(0, 100);

  const { results: matchRows } = await env.DB.prepare(
    `SELECT 1 FROM chat_events WHERE kind = 'chat' AND session_id = ? AND matched_ad_id = ? LIMIT 1`
  )
    .bind(sessionId, id)
    .all();
  const genuineMatch = sessionId && matchRows.length > 0;

  const { results: priorClickRows } = await env.DB.prepare(
    `SELECT 1 FROM chat_events WHERE kind = 'click' AND session_id = ? AND matched_ad_id = ? LIMIT 1`
  )
    .bind(sessionId, id)
    .all();
  const alreadyBilled = priorClickRows.length > 0;

  if (genuineMatch && !alreadyBilled) {
    const ipHash = await hashIp(env, request);

    await env.DB.prepare(
      `INSERT INTO chat_events (kind, session_id, ip_hash, matched_ad_id)
       VALUES ('click', ?, ?, ?)`
    )
      .bind(sessionId, ipHash, id)
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
      // Not enough left to cover another click -- stop showing it now
      // rather than spend into a larger negative balance one click at a
      // time.
      await env.DB.prepare(`UPDATE ad_submissions SET credit_active = 0 WHERE id = ?`).bind(id).run();
    }
  }

  return Response.redirect(ad.destination_url, 302);
}
