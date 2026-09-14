# Architecture | Prism Publication (last updated 14 September 2026)

Single-product static site plus a server-side chat-ad client, now with a real (Cloudflare-only) backend for ad submission and live testing. One commercial intent: labeled native cards on independent AI chatbots when prompt overlap is high enough; otherwise silence.

**Homepage is frozen as of 13 September 2026** — see [mem/current.md](../mem/current.md). Do not redesign `index.html`, `css/styles.css`, or `js/demo.js`. New work is additive (own pages/files): the blog and the ad-submission backend below already shipped this way; legal pages are still open.

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
| Public site | `index.html`, `css/styles.css`, `js/demo.js` at repo root | No `/dist` output, no build step beyond the no-op |
| Host | Cloudflare Pages, Git from GitHub | Not Workers-as-a-separate-project, not Vercel |
| Build | `echo "Building static site"` | Not `npx wrangler deploy` or `wrangler pages deploy` -- git push is the only deploy path |
| Live ads | `sdk/prismClient.js` matches `sdk/catalog.json` on the publisher **server** (static file on Pages). Optional GAM fan-out. | Never bundled into the chat widget; no googletag; no Supabase |
| Homepage demo | Local token cosine in the browser, run against a fixed scripted thread (Play/Reset) | No API key, not a live auction, no free-text input (composer disabled) |
| Ad submission backend (14 Sept 2026) | `functions/api/submit.js` + `functions/api/submissions/*` (Cloudflare Pages Functions, i.e. Workers that deploy with this Pages project) write to/read the `prism-crm` D1 database. `admin/index.html` reviews the queue. | No email/notification service, no third-party form handler, no Supabase/Vercel/Stripe |
| Live ad testing (14 Sept 2026) | `run-ads/index.html` — a second phone-UI chat, separate from the frozen homepage demo. Free-text input calls `functions/api/match.js`, which runs the real cosine matcher against **approved** D1 submissions only. | No fake LLM-generated bot reply (would need a third-party AI API); no login — advertisers just type questions and watch for their own brand |
| Analytics | Google Analytics (GA4, property `G-22TDLD3N4E`) on every public page except `admin/`. Restored 14 Sept 2026 after being found missing from the live repo (lost in an earlier rebuild). Cloudflare's own Pages/Web Analytics also runs, dashboard-native, no code. | — |
| Auth | None on the public site. Catalog is public JSON. `/admin/*` and `/api/submissions*` are gated by Cloudflare Access (dashboard-configured) plus a header check in the Function itself. | No Bearer key store; no custom login system |
| Payments (14 Sept 2026) | `functions/api/paypal/{config,create-order,_shared}.js`. $5.00 flat fee per submission, PayPal Orders API v2, server-authoritative amount, capture verified before `functions/api/submit.js` writes to D1. Currently **Sandbox mode** (`PAYPAL_MODE` unset = sandbox). Client ID/Secret in Cloudflare Pages production env vars (Secret type). | No Stripe (doesn't work in Israel); no client-trusted amount |

Default catalog: `PRISM_CATALOG_URL` or `https://prismpublication.com/sdk/catalog.json`. Third-party wiring and smoke results: [publisher-key.md](publisher-key.md).

## Entrypoint

1. Humans and crawlers: `index.html` at `/`.
2. Homepage demo: `js/demo.js` waits for the visitor to press **Play**, then types out the fixed travel script turn by turn, scoring each ad turn against the local catalog with the same cosine matcher. **Reset** replays it. No `DOMContentLoaded` auto-run and no free-text prompt.
3. Production fill: publisher Node or Worker imports `displayAd` from `sdk/prismClient.js` **after** the assistant finishes a complete thought.
4. Advertiser flow (14 Sept 2026): `ad-submission/` → `run-ads/`, real pages with real Functions behind them (see the sequence diagram below). The homepage nav's "Run ads" link points to `/run-ads/`, not a same-page anchor anymore — `#advertisers` and `#sdk` still exist as homepage sections but are no longer linked from nav directly, only reachable by scrolling.

There is no client-side view toggle on the homepage itself — it's still one static page.

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

## Sequence: submit → approve → test (the actual current product loop)

```
Advertiser    ad-submission/    functions/api/submit.js    D1 (prism-crm)    Daniel        run-ads/    functions/api/match.js
    │              │                      │                      │             │              │                 │
    │ fill form    │                      │                      │             │              │                 │
    │─────────────►│                      │                      │             │              │                 │
    │              │  POST /api/submit    │                      │             │              │                 │
    │              │─────────────────────►│  category in list?   │             │              │                 │
    │              │                      │  auto_cleared/       │             │              │                 │
    │              │                      │  needs_review ───────►             │              │                 │
    │              │                      │                      │             │              │                 │
    │              │                      │                      │  GET /api/submissions       │                 │
    │              │                      │                      │◄────────────│ (Access-gated)│                 │
    │              │                      │                      │             │              │                 │
    │              │                      │  PATCH status=approved             │              │                 │
    │              │                      │                      │◄────────────│              │                 │
    │              │                      │                      │             │              │                 │
    │  type a real question                                                    │              │                 │
    │──────────────────────────────────────────────────────────────────────────────────────────►│                 │
    │              │                      │                      │             │              │ POST /api/match │
    │              │                      │                      │◄─────────────────────────────────────────────│
    │              │                      │                      │  cosine >= 0.65 vs approved rows only         │
    │  card, labeled, or "no card matched"                                     │              │◄────────────────│
    │◄──────────────────────────────────────────────────────────────────────────────────────────│                 │
```

Approving in `/admin/` only updates the D1 row's status — it does **not** add the creative to `sdk/catalog.json`, which is what a third-party publisher's `displayAd` call actually reads. Those are still two separate catalogs; see "Known gap" in [ad-submission-backend.md](ad-submission-backend.md).

## Money path (operator, not public rates)

See [pricing.md](pricing.md). Buyer is an **active AI campaign** owner. Bill rendered labeled cards (CPC preferred, then rendered impression, then IO budget transfer). Amazon Associates tag `prismpublicat-20` is fallback catalog, not the intercept product. Split lives on the insertion order; do not invent a take rate on the homepage.

**Submission/testing tier (built 14 Sept 2026, live in Sandbox):** $5.00 flat fee per campaign submission via PayPal, covering review plus unlimited `/run-ads/` testing on that campaign. Separate from the IO-negotiated rate above — this is a low, near-cost fee meant to validate whether anyone uses the flow at all, not the real ad-serving price. `ad-submission/` and `run-ads/` copy reflects the $5 fee.

## Key files

| Path | Role |
|---|---|
| `index.html` | Product page, JSON-LD, hero, phone demo markup, SDK Q&A |
| `css/styles.css` | Light-blue marketing tokens, hero highlights, demo card |
| `js/demo.js` | Scripted phone-thread demo (travel packing), local cosine catalog, Play/Reset |
| `sdk/prismClient.js` | Server `displayAd` against static `sdk/catalog.json` |
| `sdk/catalog.json` | Public creatives on Pages |
| `sdk/gamClient.js` | GAM demand leg (fill URL, network, ad unit) |
| `blog/` | 15 posts + index, migrated from an abandoned Desktop draft. Own template instance of the same foundation (`css/styles.css` + additive `css/blog.css`) |
| `ad-submission/index.html` | Real submission form (not `mailto:`), posts to `functions/api/submit.js` |
| `run-ads/index.html` | Live ad-testing chat, posts to `functions/api/match.js` |
| `admin/index.html` | Submission review queue, Cloudflare Access-gated |
| `functions/api/submit.js` | Public: validate + category-triage + insert into D1 |
| `functions/api/submissions/{index,[id]}.js` | Access-gated: list / approve / reject |
| `functions/api/match.js` | Public: live cosine match against approved D1 rows |
| `d1/schema.sql` | `ad_submissions` table definition, already applied to the real `prism-crm` database |
| `wrangler.toml` | Local dev only (`wrangler pages dev`) — not read by the Git-connected Pages build |
| `mem/current.md` | Locked decisions carry-forward — **read this first**, especially the homepage freeze and the "blocked on Daniel" list |
| `docs/ad-submission-backend.md` | Full backend setup detail, incl. the one-time Cloudflare dashboard steps |
| `docs/publisher-key.md` | Third-party wiring and smoke test |
| `docs/ad-submission.md` | Creative rules and 0.65 / 120ms floors |
| `docs/pricing.md` | Intercept pricing model (IO-negotiated tier; the $5 flat tier is documented above, not yet in this file) |
| `docs/aeo-strategy.md` | Canonical and crawler rules |
| `.cursor/rules/prism-pages-static.mdc` | Pages-only deploy |
| `.cursor/rules/cloudflare-pages-deploy.mdc` | Git via Pages tab, not Workers |

## Constraints that must not regress

- Repo root is the Pages output. Do not add Worker `main` or `[assets]`.
- One product line on the homepage. No support-bot or crisis-language metrics.
- Canonical: `https://prismpublication.com/` with no `www` and no query string.
- Keys stay on the server. Browser only draws HTML the publisher already trusts.
