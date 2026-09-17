// Safely fetches a product page for the ad-builder (draft-ad.js) and pulls
// out just <title>, meta description, and the first <h1> -- nothing else is
// read. Workers don't have privileged access to any "internal" network, so
// this is a sanity check against a lazy paste (localhost, a bare private
// IP), not a full SSRF defense against DNS rebinding.

// Raised from 1MB: modern product pages (Shein, Amazon) often carry
// several MB of inline JS/data, and the old cap was throwing "too large"
// on completely normal pages before it ever reached the title/description.
const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const FETCH_TIMEOUT_MS = 12000; // real product pages (Amazon especially) are heavy; 5s was too tight

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::1"]);

function isPrivateIPv4(hostname) {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

export function validateUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  if (url.protocol !== "https:") return { error: "URL must start with https://." };
  if (url.port && url.port !== "443") return { error: "URL can't use a custom port." };

  const hostname = url.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIPv4(hostname)
  ) {
    return { error: "That URL isn't allowed." };
  }
  return { url };
}

function capStream(body, maxBytes) {
  let received = 0;
  return body.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > maxBytes) {
          controller.error(new Error("Response too large."));
          return;
        }
        controller.enqueue(chunk);
      },
    })
  );
}

export async function extractPageMeta(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      credentials: "omit",
      headers: { "user-agent": "PrismAdBuilder/1.0 (+https://prismpublication.com)" },
    });
  } catch (err) {
    throw new Error(err.name === "AbortError" ? "That page took too long to load." : "Could not reach that URL.");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(`Could not fetch that page (${res.status}).`);

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) throw new Error("That URL isn't an HTML page.");

  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength > MAX_BYTES) throw new Error("That page is too large to read.");

  const meta = { title: "", description: "", headline: "" };
  let sawH1 = false;

  const rewriter = new HTMLRewriter()
    .on("title", {
      text(text) {
        meta.title += text.text;
      },
    })
    .on('meta[name="description" i]', {
      element(element) {
        meta.description = (element.getAttribute("content") || "").trim();
      },
    })
    .on("h1", {
      text(text) {
        if (!sawH1) meta.headline += text.text;
      },
      element(element) {
        element.onEndTag(() => {
          sawH1 = true;
        });
      },
    });

  try {
    const transformed = rewriter.transform(new Response(capStream(res.body, MAX_BYTES)));
    await transformed.text(); // drain to run the handlers above; output itself is discarded
  } catch {
    throw new Error("That page is too large to read.");
  }

  return {
    title: meta.title.trim().slice(0, 300),
    description: meta.description.slice(0, 300),
    headline: meta.headline.trim().slice(0, 300),
  };
}
