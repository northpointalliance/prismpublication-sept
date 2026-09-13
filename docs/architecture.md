# Architecture | Prism Publication (last updated 11 September 2026)

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
| Public site | `index.html`, `css/styles.css`, `js/demo.js` at repo root | No `wrangler.toml`, no Pages Functions, no `/dist` output |
| Host | Cloudflare Pages, Git from GitHub | Not Workers, not Vercel |
| Build | `echo "Building static site"` | Not `npx wrangler deploy` |
| Live ads | `sdk/prismClient.js` matches `sdk/catalog.json` on the publisher **server** (static file on Pages). Optional GAM fan-out. | Never bundled into the chat widget; no googletag; no Supabase; no Pages Functions |
| Homepage demo | Local token cosine in the browser, run against a fixed scripted thread (Play/Reset) | No API key, not a live auction, no free-text input (composer disabled) |
| Auth | None on this host. Catalog is public JSON. | No Bearer key store; HMAC not used |

**Known drift (11 September 2026):** `index.html` was rebuilt from screenshots by a different session and currently ships with no JSON-LD in `<head>` and no SDK Q&A/matching-contract table — both required by [aeo-strategy.md](aeo-strategy.md). Also, `demo/index.html` and `ad-submission/index.html` are deleted in the working tree even though [mem/current.md](../mem/current.md) locks them as part of the Pages set. None of this is fixed yet; see the root [README.md](../README.md#known-gaps-as-of-11-september-2026).

Default catalog: `PRISM_CATALOG_URL` or `https://prismpublication.com/sdk/catalog.json`. Third-party wiring and smoke results: [publisher-key.md](publisher-key.md).

## Entrypoint

1. Humans and crawlers: `index.html` at `/`.
2. Homepage demo: `js/demo.js` waits for the visitor to press **Play**, then types out the fixed travel script turn by turn, scoring each ad turn against the local catalog with the same cosine matcher. **Reset** replays it. No `DOMContentLoaded` auto-run and no free-text prompt.
3. Production fill: publisher Node or Worker imports `displayAd` from `sdk/prismClient.js` **after** the assistant finishes a complete thought.

4. Advertiser flow: the "Start a test" button/nav link toggles `#view-hero` off and `#view-form` on via `switchView()` in `index.html` — a client-side view swap, not a route. The form posts nowhere; submit shows an `alert()` and the copy directs the visitor to email instead.

## Matcher state machine (homepage demo and live contract)

Public floors: cosine **0.65**, match budget **under 120ms**. Miss or timeout: `null`. Null is not billable.

```
                    prompt + niche
                          │
                          ▼
                 ┌─────────────────┐
                 │     IDLE        │
                 │ (Play / SDK)    │
                 └────────┬────────┘
                          │ play / displayAd
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

Fill card UI (homepage demo, current): badge, title, description, CTA. No cosine, advertiser name, or millisecond line on the sponsored card. Message/ad counters are the only matcher stats shown, and only for the scripted run.

## Sequence: homepage demo (this repo)

```
Visitor          index.html       demo.js            Catalog (in-file)
   │                  │                │                │
   │  GET /           │                │                │
   │─────────────────►│                │                │
   │  HTML+CSS+JS     │                │                │
   │◄─────────────────│                │                │
   │  Press Play      │                │                │
   │─────────────────►│───────────────►│  score fixed   │
   │                  │                │   script turn  │
   │                  │                │───────────────►│
   │                  │                │◄───────────────│
   │  card, in order  │◄───────────────│                │
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
| `index.html` | Homepage: hero, phone demo markup, advertiser form. No JSON-LD or SDK Q&A currently (see "Known drift" above) |
| `css/styles.css` | Light-blue marketing tokens, hero highlights, demo card |
| `js/demo.js` | Scripted phone-thread demo (travel packing), local cosine catalog, Play/Reset |
| `sdk/prismClient.js` | Server `displayAd` against static `sdk/catalog.json` |
| `sdk/catalog.json` | Public creatives on Pages |
| `sdk/gamClient.js` | GAM demand leg (fill URL, network, ad unit) |
| `mem/current.md` | Locked decisions carry-forward from prior sessions — read before touching public HTML/CSS |
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
