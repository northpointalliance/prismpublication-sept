# Architecture | Prism Publication (9 September 2026)

Single-product static site plus a server-side chat-ad client. One commercial intent: labeled native cards on independent AI chatbots when prompt overlap is high enough; otherwise silence.

```
╔════════════════════════════════════════╗
║ PROJECT: Prism Publication             ║
╠════════════════════════════════════════╣
║ Language: HTML, CSS, JavaScript        ║
║ Framework: none (static Pages)         ║
║ Type: Web + server SDK client          ║
╚════════════════════════════════════════╝
```

## Stack summary

| Layer | What ships | What does not |
|---|---|---|
| Public site | `index.html`, `css/styles.css`, `js/sandbox.js` at repo root | No `wrangler.toml`, no Pages Functions, no `/dist` output |
| Host | Cloudflare Pages, Git from GitHub | Not Workers, not Vercel |
| Build | `echo "Building static site"` | Not `npx wrangler deploy`, not `scripts/build-static.js` |
| Live ads | `sdk/prismClient.js` matches `sdk/catalog.json` on the publisher **server** (static file on Pages). Optional GAM fan-out. | Never bundled into the chat widget; no googletag; no Supabase; no Pages Functions |
| Sandbox | Local token cosine in the browser | No API key, not a live auction |
| Auth | None on this host. Catalog is public JSON. | No Bearer key store; HMAC not used |

Default catalog: `PRISM_CATALOG_URL` or `https://prismpublication.com/sdk/catalog.json`. Third-party wiring and smoke results: [publisher-key.md](publisher-key.md).

## Entrypoint

1. Humans and crawlers: `index.html` at `/`.
2. Sandbox: `js/sandbox.js` on `DOMContentLoaded`, then `applySample("fitness")`.
3. Production fill: publisher Node or Worker imports `displayAd` from `sdk/prismClient.js` **after** the assistant finishes a complete thought.

`scripts/build-static.js` and `components/editor.js` are leftover kit. They are not on the Pages path. The live homepage does not import them.

## Matcher state machine (sandbox and live contract)

Public floors: cosine **0.65**, match budget **under 120ms**. Miss or timeout: `null`. Null is not billable.

```
                    prompt + niche
                          │
                          ▼
                 ┌─────────────────┐
                 │     IDLE        │
                 │  (form / SDK)   │
                 └────────┬────────┘
                          │ run / displayAd
                          ▼
                 ┌─────────────────┐
                 │    MATCHING     │
                 │  tokenize+score │
                 └────────┬────────┘
            score>=0.65   │    score<0.65 or timeout
            and in time   │
          ┌───────────────┴───────────────┐
          ▼                               ▼
   ┌─────────────┐                 ┌─────────────┐
   │    FILL     │                 │    NULL     │
   │ labeled card│                 │ no house ad │
   └──────┬──────┘                 └──────┬──────┘
          │ impression/click              │
          │ only after render             │ not billed
          ▼                               ▼
   ┌─────────────┐                 ┌─────────────┐
   │   TRACKED   │                 │  REPLY ONLY │
   └─────────────┘                 └─────────────┘
```

Fill card UI (sandbox, 9 Sept): badge, title, description, CTA. No cosine, advertiser name, or millisecond line on the sponsored card. Null results may still show matcher stats in the sandbox only.

## Sequence: sandbox (this repo)

```
Visitor          index.html       sandbox.js         Catalog
   │                  │                │                │
   │  GET /           │                │                │
   │─────────────────►│                │                │
   │  HTML+CSS+JS     │                │                │
   │◄─────────────────│                │                │
   │  Match prompt    │                │                │
   │─────────────────►│───────────────►│  score pool    │
   │                  │                │───────────────►│
   │                  │                │◄───────────────│
   │  card or null    │◄───────────────│                │
   │◄─────────────────│  no network    │                │
```

## Sequence: live publisher fill

```
User     Chat UI     Publisher server     prismClient      Pages catalog / GAM
  │         │               │                  │              │
  │ prompt  │               │                  │              │
  │────────►│               │                  │              │
  │         │  generate     │                  │              │
  │         │──────────────►│                  │              │
  │         │  reply        │                  │              │
  │         │◄──────────────│                  │              │
  │         │               │ displayAd(topic) │              │
  │         │               │─────────────────►│ fan-out      │
  │         │               │                  │──GET catalog─►│
  │         │               │                  │──GAM fill───►│
  │         │               │  card or null    │◄─────────────│
  │         │               │◄─────────────────│  GAM wins    │
  │  HTML   │◄──────────────│  if both fill    │              │
  │  card?  │  browser      │  client never in │              │
  │         │               │  the widget      │              │
```

Impression and click helpers on the Pages path return `{ ok: true }` with no remote POST. GAM tracking stays on the GAM stack.

## Money path (operator, not public rates)

See [pricing.md](pricing.md). Buyer is an **active AI campaign** owner. Bill rendered labeled cards (CPC preferred, then rendered impression, then IO budget transfer). Amazon Associates tag `prismpublicat-20` is fallback catalog, not the intercept product. Split lives on the insertion order; do not invent a take rate on the homepage.

## Key files

| Path | Role |
|---|---|
| `index.html` | Product page, JSON-LD, hero, sandbox markup, SDK Q&A |
| `css/styles.css` | Light-blue marketing tokens, hero highlights, sandbox card |
| `js/sandbox.js` | Local cosine catalog (fitness, sleep, productivity) |
| `sdk/prismClient.js` | Server `displayAd` against static `sdk/catalog.json` |
| `sdk/catalog.json` | Public creatives on Pages |
| `sdk/gamClient.js` | GAM demand leg (fill URL, network, ad unit) |
| `docs/publisher-key.md` | Third-party wiring and smoke test |
| `docs/ad-submission.md` | Creative rules and 0.65 / 120ms floors |
| `docs/pricing.md` | Intercept pricing model |
| `docs/aeo-strategy.md` | Canonical and crawler rules |
| `.cursor/rules/prism-pages-static.mdc` | Pages-only deploy |
| `.cursor/rules/cloudflare-pages-deploy.mdc` | Git via Pages tab, not Workers |

## Constraints that must not regress

- Repo root is the Pages output. Do not add Worker `main` or `[assets]`.
- One product line on the homepage. No support-bot or crisis-language metrics.
- Canonical: `https://prismpublication.com/` with no `www` and no query string.
- Keys stay on the server. Browser only draws HTML the publisher already trusts.
