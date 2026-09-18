// Low-level "call whichever model is configured" helper, shared by
// answer.js (free-text chat replies) and draft-ad.js (structured JSON
// extraction). Same provider choice as the chat: OpenAI if OPENAI_API_KEY
// is set, otherwise the Workers AI binding, which needs no secret.

// Added 18 September 2026: neither call below used to have any timeout at
// all, unlike the page fetch in urlFetch.js, which learned this lesson
// weeks ago. If the model hangs (a slow Workers AI cold start, an OpenAI
// latency spike), the request just keeps running until Cloudflare's own
// platform-level limit kills it -- which happens *outside* any try/catch
// in this codebase, so the caller never gets a normal thrown Error, just
// a broken, non-JSON response. That's what turned into draft-ad.js's
// "Could not reach the ad builder" with no real reason. A bounded timeout
// here means a hang becomes an ordinary caught Error instead.
const AI_TIMEOUT_MS = 15000;

function timeout(ms, label) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} took too long to respond.`)), ms);
  });
}

export async function complete(env, { system, user, maxTokens = 220 }) {
  if (env.OPENAI_API_KEY) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    let res;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: maxTokens,
          temperature: 0.4,
        }),
      });
    } catch (err) {
      throw new Error(err.name === "AbortError" ? "OpenAI took too long to respond." : "Could not reach OpenAI.");
    } finally {
      clearTimeout(t);
    }
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI returned no text.");
    return { text, provider: "openai" };
  }

  if (env.AI) {
    // env.AI.run() takes no AbortSignal -- there's no way to actually
    // cancel it early. Racing it against a timer at least means OUR code
    // gives up and returns a clean error before Cloudflare's own limit
    // would, even though the orphaned call keeps running in the
    // background until it finishes on its own.
    //
    // Not @cf/meta/llama-3.1-8b-instruct (no "-fast" suffix) -- that exact
    // model id is marked Deprecated in Cloudflare's current catalog and
    // silently returned no usable response when this was first wired up.
    const result = await Promise.race([
      env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
      }),
      timeout(AI_TIMEOUT_MS, "Workers AI"),
    ]);
    const text = String(result?.response || "").trim();
    if (!text) throw new Error("Workers AI returned no text.");
    return { text, provider: "workers-ai" };
  }

  throw new Error("No model configured (no AI binding, no OPENAI_API_KEY).");
}
