// Public endpoint: POST /api/chat
// The visitor-facing chat on /run-ads: a general-purpose answer (see
// _lib/answer.js -- not topic-restricted, ads aren't gated by niche either)
// plus a sponsored card only when the message clears the shared matcher's
// 0.65 floor against the live approved pool (_lib/matcher.js).
//
// Rate limiting and the global daily cap read chat_events in D1 instead of
// a KV namespace -- at a few hundred visitors, a couple of extra D1 reads
// per turn costs nothing and needed no new binding to ship.

import { findBestAd, scoreAd } from "./_lib/matcher.js";
import { generateAnswer } from "./_lib/answer.js";
import { hashIp } from "./_lib/hash.js";

const MAX_MESSAGE_LENGTH = 500;
const PER_IP_10_MIN_LIMIT = 10;
const PER_IP_DAILY_LIMIT = 50;
const GLOBAL_DAILY_LIMIT = 500;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function countSince(env, whereExtra, bindings, minutesAgo) {
  const { results } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM chat_events
     WHERE kind = 'chat' AND created_at > datetime('now', ?) ${whereExtra}`
  )
    .bind(`-${minutesAgo} minutes`, ...bindings)
    .all();
  return results[0]?.n || 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected JSON body." }, 400);
  }

  const message = String(body.message || "").trim();
  const sessionId = String(body.sessionId || "").trim().slice(0, 100);

  if (!message) return json({ error: "Message is empty." }, 400);
  if (message.length > MAX_MESSAGE_LENGTH) return json({ error: "Message is too long." }, 400);
  if (!sessionId) return json({ error: "Missing sessionId." }, 400);

  const ipHash = await hashIp(env, request);

  const globalToday = await countSince(env, "", [], 24 * 60);
  if (globalToday >= GLOBAL_DAILY_LIMIT) {
    return json(
      { error: "The live chat is at its daily limit for now. Try again tomorrow, or watch the demo above." },
      429
    );
  }

  const recentFromIp = await countSince(env, "AND ip_hash = ?", [ipHash], 10);
  if (recentFromIp >= PER_IP_10_MIN_LIMIT) {
    return json({ error: "Too many messages -- wait a few minutes and try again." }, 429);
  }

  const todayFromIp = await countSince(env, "AND ip_hash = ?", [ipHash], 24 * 60);
  if (todayFromIp >= PER_IP_DAILY_LIMIT) {
    return json({ error: "You've hit today's message limit for the live chat. Try again tomorrow." }, 429);
  }

  const { results: lastRows } = await env.DB.prepare(
    `SELECT message FROM chat_events
     WHERE kind = 'chat' AND session_id = ?
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(sessionId)
    .all();
  if (lastRows[0]?.message === message) {
    return json({ error: "You already asked that -- try a different question." }, 400);
  }

  // A session's own draft ad (from /api/draft-ad) is scored alongside the
  // public pool, but is only ever visible to the session that created it --
  // findBestAd doesn't know or care whose session it is, it's just given
  // as one more candidate for this one request.
  const { results: testAdRows } = await env.DB.prepare(
    `SELECT id, brand, category, title, description, destination_url, cta_text
     FROM test_ads
     WHERE session_id = ? AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(sessionId)
    .all();
  const testAd = testAdRows[0] || null;
  const extraRows = testAd ? [{ ...testAd, __isTestAd: true }] : [];

  const [{ text: answer }, { ad, score }] = await Promise.all([
    generateAnswer(env, message),
    findBestAd(env, message, extraRows),
  ]);
  const testAdScore = testAd ? scoreAd(message, testAd) : null;

  const isAffiliate = Boolean(ad && !ad.__isTestAd && ad.source === "affiliate");
  const matchedSubmissionId = ad && !ad.__isTestAd && !isAffiliate ? ad.id : null;
  const matchedLibraryId = isAffiliate ? ad.id : null;

  await env.DB.prepare(
    `INSERT INTO chat_events (kind, session_id, ip_hash, message, matched_ad_id, matched_library_id, score, answer_chars)
     VALUES ('chat', ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(sessionId, ipHash, message, matchedSubmissionId, matchedLibraryId, score, answer.length)
    .run();

  return json({
    answer,
    matchScore: Number(score.toFixed(3)),
    testAdScore: testAdScore == null ? null : Number(testAdScore.toFixed(3)),
    card: ad
      ? ad.__isTestAd
        ? {
            isTestAd: true,
            brand: ad.brand,
            title: ad.title,
            description: ad.description,
            ctaText: ad.cta_text,
            destinationUrl: ad.destination_url,
          }
        : isAffiliate
          ? {
              isAffiliate: true,
              brand: ad.brand,
              title: ad.title,
              description: ad.description,
              ctaText: ad.cta_text,
              destinationUrl: ad.destination_url,
            }
          : {
              id: ad.id,
              brand: ad.brand,
              title: ad.title,
              description: ad.description,
              ctaText: ad.cta_text,
            }
      : null,
  });
}

export async function onRequestGet() {
  return json({ error: "Use POST." }, 405);
}
