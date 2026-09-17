// Low-level "call whichever model is configured" helper, shared by
// answer.js (free-text chat replies) and draft-ad.js (structured JSON
// extraction). Same provider choice as the chat: OpenAI if OPENAI_API_KEY
// is set, otherwise the Workers AI binding, which needs no secret.

export async function complete(env, { system, user, maxTokens = 220 }) {
  if (env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
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
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI returned no text.");
    return { text, provider: "openai" };
  }

  if (env.AI) {
    // Not @cf/meta/llama-3.1-8b-instruct (no "-fast" suffix) -- that exact
    // model id is marked Deprecated in Cloudflare's current catalog and
    // silently returned no usable response when this was first wired up.
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
    });
    const text = String(result?.response || "").trim();
    if (!text) throw new Error("Workers AI returned no text.");
    return { text, provider: "workers-ai" };
  }

  throw new Error("No model configured (no AI binding, no OPENAI_API_KEY).");
}
