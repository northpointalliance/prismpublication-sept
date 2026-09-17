// Hashes a visitor's IP for rate limiting and click dedup -- the raw IP is
// never stored. IP_HASH_SALT should be set as a Pages secret in production
// (wrangler pages secret put IP_HASH_SALT); without it this still works but
// is crackable against the small IPv4 space, since a fixed public salt is
// no better than no salt.
const DEV_FALLBACK_SALT = "prism-dev-salt-set-IP_HASH_SALT-in-production";

export async function hashIp(env, request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const salt = env.IP_HASH_SALT || DEV_FALLBACK_SALT;
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
