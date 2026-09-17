// Public endpoint: GET /c/:id?s=sessionId
// Card-click redirect for the /run-ads chat: logs the click, then sends the
// visitor to the advertiser's destination_url. Cards never link straight to
// the destination so every click is counted (needed for the credit/billing
// model once that's built, and useful before that too).

import { hashIp } from "../api/_lib/hash.js";

export async function onRequestGet(context) {
  const { request, env, params } = context;

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return new Response("Invalid ad id.", { status: 400 });
  }

  const { results } = await env.DB.prepare(
    `SELECT destination_url FROM ad_submissions WHERE id = ? AND status = 'approved'`
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

  return Response.redirect(ad.destination_url, 302);
}
