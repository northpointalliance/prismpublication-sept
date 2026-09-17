# Architecture | Prism Publication (last updated 17 September 2026)

Single-product static site plus a server-side chat-ad client, backed by a Cloudflare-only stack: D1 for storage, Workers AI (or OpenAI, provider-swappable) for the general chat, PayPal for payment. The product is the site's own phone UI -- a general-purpose chat, open to anyone -- not a third-party chatbot SDK play; see "The repositioning" below.

**Homepage is frozen as of 13 September 2026** -- see [mem/current.md](../mem/current.md). Do not redesign `index.html`, `css/styles.css`, or `js/demo.js`. New work is additive (own pages/files). Narrow, non-visual factual corrections (category names, brand-safety policy text) are an exception already made twice -- text only, never structure or design, and still worth a heads-up first.

```
╔════════════════════════════════════════╗
║ PROJECT: Prism Publication             ║
╠════════════════════════════════════════╣
║ Language: HTML, CSS, JavaScript        ║
║ Framework: none (static Pages)         ║
║ Type: Web + server SDK client          ║
╚════════════════════════════════════════╝
```

## The repositioning (17 September 2026)

The original niches (fitness/sleep/productivity, later fitness/travel/health-wellness) were an artifact of an earlier, abandoned MVP aimed at third-party chatbot developers -- zero real installs. The current MVP, confirmed directly: **the site's own phone UI, general-purpose like a normal AI chat, open to anyone who wants to run contextualized ads, sized for roughly 300-500 visitors.** Niches are "nearly irrelevant" now. The chat itself is not topic-restricted; the advertiser category field is free text, gated by brand-safety rules, not a niche whitelist. Full record: [run-ads-strategy-2026-09-16.md](run-ads-strategy-2026-09-16.md).

## Stack summary

| Layer | What ships | What does not |
|---|---|---|
| Public site | `index.html`, `css/styles.css`, `js/demo.js` at repo root | No `/dist` output, no build step beyond the no-op |
| Host | Cloudflare Pages, Git from GitHub, **Build System v3** | Not Workers-as-a-separate-project, not Vercel |
| Build | `echo "Building static site"` | Not `npx wrangler deploy` or `wrangler pages deploy` -- git push is the only deploy path |
| Bindings | Read from `wrangler.toml` in the repo on every Git-connected build (Build System v3 -- confirmed via the dashboard refusing manual binding additions) | Not dashboard-added; the dashboard only still does secrets |
| Homepage demo | Local token cosine in the browser, run against a fixed scripted thread (Play/Reset), reading `sdk/catalog.json` | No API key, not a live auction, no free-text input (composer disabled) -- this demo is untouched by everything below |
| Live ad testing (14 Sept, general chat 17 Sept) | `run-ads/index.html` -- a phone-UI page, separate from the frozen homepage demo. Two things live here: `/api/match` (advertiser self-test against the approved pool) and `/api/chat` (a real general-purpose chat, any visitor, any topic, cards on contextual match only) | No account, no login -- session state is a random id in `sessionStorage` |
| Ad-from-URL builder (17 Sept) | Paste a product URL on `/run-ads` -> `/api/draft-ad` fetches it safely and drafts a card -> edit -> `/api/test-ad` saves it as that session's private test ad, scored in `/api/chat` alongside the public pool | No login, no payment for drafting or testing |
| Ad submission backend (14 Sept, screening + free 17 Sept) | `functions/api/submit.js` runs automated screening (`_lib/screening.js`, one model call, light-touch: only the prohibited-category list blocks outright, everything else routes to manual review) then writes to D1, **free**. `admin/index.html` reviews the queue. | No email/notification service, no third-party form handler, no Supabase/Vercel/Stripe |
| Go-live credit (17 Sept) | Once approved, the advertiser buys prepaid click credit on `functions/campaign/[token].js` (`/campaign/:token` -- their only way back, no account system) via PayPal. `_lib/matcher.js`'s `findBestAd` gates the chat pool on `credit_active`; `functions/c/[id].js` deducts a click's cost per click and deactivates on exhaustion. | No webhook (reuses the existing direct-capture-and-verify pattern); no refund automation (email request only) |
| Analytics | Google Analytics (GA4, property `G-22TDLD3N4E`) on every public page except `admin/`. Cloudflare's own Pages/Web Analytics also runs, dashboard-native, no code. | -- |
| Auth | None on the public site. `/admin/*` and `/api/submissions*` are gated by Cloudflare Access (dashboard-configured) plus a header check in the Function itself. Advertisers use a bookmarked `access_token` link instead of any login. | No Bearer key store; no custom login system |
| Payments (14 Sept, generalized 17 Sept) | `functions/api/paypal/{config,create-order,_shared}.js`. `_shared.js`'s `createOrder`/`captureOrder` take/return a plain amount now (no hardcoded fee) -- the caller validates against `_lib/pricing.js`'s allowed credit packs. Submission itself is free; the only PayPal flow left is buying credit. Currently **Sandbox mode**. | No Stripe (doesn't work in Israel); no client-trusted amount |

Default catalog: `PRISM_CATALOG_URL` or `https://prismpublication.com/sdk/catalog.json`. Third-party wiring and smoke results: [publisher-key.md](publisher-key.md).

## Entrypoint

1. Humans and crawlers: `index.html` at `/`.
2. Homepage demo: `js/demo.js` waits for the visitor to press **Play**, then types out the fixed travel script turn by turn, scoring each ad turn against the local catalog with the same cosine matcher. **Reset** replays it. No `DOMContentLoaded` auto-run and no free-text prompt.
3. Production fill: publisher Node or Worker imports `displayAd` from `sdk/prismClient.js` **after** the assistant finishes a complete thought.
4. Advertiser flow (17 Sept): `ad-submission/` (free, screened, returns an `access_token` link) -> `/run-ads/` (test free, build an ad from a URL, or chat generally) -> once approved, `/campaign/{token}` to buy credit and go live.

There is no client-side view toggle on the homepage itself -- it's still one static page.

## Matcher state machine (unchanged mechanism, now also gated on credit)

Public floors: cosine **0.65**, match budget **under 120ms**. Miss or timeout: `null`. Null is not billable. `_lib/matcher.js` is shared by `/api/match` (advertiser self-test, `requireActive: false` -- content match, not billing state) and `/api/chat` (real serving, `requireActive: true` by default -- gated on `credit_active`).

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

## Sequence: the actual current product loop (17 September 2026)

```
Visitor    /run-ads/ (chat)    /api/chat    /api/draft-ad    /api/test-ad    /ad-submission/    /api/submit    D1    Daniel/admin    /campaign/:token    /api/credit/purchase
   │            │                  │             │               │                 │                 │         │         │                │                    │
   │ ask anything                  │             │               │                 │                 │         │         │                │                    │
   │───────────►│─────────────────►│ answer + card (contextual match, any active approved ad)         │         │         │                │                    │
   │            │                  │             │               │                 │                 │         │         │                │                    │
   │ paste product URL             │             │               │                 │                 │         │         │                │                    │
   │───────────►│─────────────────────────────►│ drafted card    │                 │                 │         │         │                │                    │
   │ edit, test │◄──────────────────────────────┘                │                 │                 │         │         │                │                    │
   │───────────►│─────────────────────────────────────────────►│ saved private test ad (scored in /api/chat, never shown to others)         │                    │
   │            │                                                │                 │                 │         │         │                │                    │
   │ "submit for review" (free) ───────────────────────────────────────────────►│ screen -> free insert         │         │                │                    │
   │                                                                              │─────────────────►│────────►│         │                │                    │
   │  access_token link returned                                                 │                             │         │                │                    │
   │◄─────────────────────────────────────────────────────────────────────────────────────────────────────────│         │                │                    │
   │                                                                                                            │  approve in /admin/       │                    │
   │                                                                                                            │◄────────│                │                    │
   │  open bookmarked /campaign/:token, buy credit ───────────────────────────────────────────────────────────────────────────────────────►│                    │
   │                                                                                                            │         │  credit_active=1, ledger row       │
   │                                                                                                            │◄──────────────────────────────────────────────│
   │  card now live in /api/chat for real visitors -- clicks deduct from the ledger, deactivate on exhaustion   │         │                │                    │
```

Approving in `/admin/` only updates the D1 row's status -- it does **not** add the creative to `sdk/catalog.json`, which is a separate, unused-by-this-loop static catalog (see "Known gap" in [ad-submission-backend.md](ad-submission-backend.md)).

## Money path (operator)

Retired the $5-at-submission fee (14 Sept) entirely as of 17 Sept -- confirmed directly this was a real removal, not additive. **Submitting and testing a campaign is free.** The only charge: prepaid click credit, bought via `/campaign/{token}` once approved, billed per click, tracked as a ledger (`credit_ledger` -- balance is always `SUM(amount_cents)`, never a stored running total). Both `CREDIT_PACKS_CENTS` and `PRICE_PER_CLICK_CENTS` in `functions/api/_lib/pricing.js` are **explicit placeholders**, not numbers Daniel has set. The older intercept/IO pricing model described in [pricing.md](pricing.md) predates the repositioning above and needs its own rewrite -- not attempted yet, flagged repeatedly.

## Key files

| Path | Role |
|---|---|
| `index.html` | Product page, JSON-LD, hero, phone demo markup, SDK Q&A (frozen -- see above) |
| `css/styles.css` | Light-blue marketing tokens, hero highlights, demo card, chat bubbles |
| `js/demo.js` | Scripted phone-thread demo (travel packing), local cosine catalog, Play/Reset |
| `sdk/prismClient.js` | Server `displayAd` against static `sdk/catalog.json` |
| `sdk/catalog.json` | Public creatives on Pages, used only by the homepage demo |
| `sdk/gamClient.js` | GAM demand leg (fill URL, network, ad unit) |
| `blog/` | 15 posts + index, own template instance of the same foundation |
| `ad-submission/index.html` | Free submission form, screened server-side, returns a campaign access-token link |
| `run-ads/index.html` | General live chat + advertiser self-test + ad-from-URL builder |
| `admin/index.html` | Submission review queue, Cloudflare Access-gated |
| `functions/campaign/[token].js` | Advertiser's one page: status, and once approved, buy-credit checkout |
| `functions/api/submit.js` | Public: screen, then free insert into D1, returns `access_token` |
| `functions/api/chat.js` | Public: general chat answer + contextual card, rate-limited via D1 |
| `functions/api/draft-ad.js` | Public: fetch a URL safely, draft a card via the model (suggestion only) |
| `functions/api/test-ad.js` | Public: save the (edited) draft as the session's private test ad |
| `functions/api/match.js` | Public: advertiser self-test, content match only, ignores credit state |
| `functions/api/credit/purchase.js` | Public: verify token + approval, capture PayPal payment, credit the ledger |
| `functions/c/[id].js` | Public: card-click redirect, logs + deducts credit, deactivates on exhaustion |
| `functions/api/submissions/{index,[id]}.js` | Access-gated: list / approve / reject |
| `functions/api/_lib/matcher.js` | Shared cosine matcher, `requireActive` option gates on credit |
| `functions/api/_lib/screening.js` | Automated screening -- light-touch, prohibited-category block only |
| `functions/api/_lib/model.js` | Shared "call whichever model is configured" (OpenAI or Workers AI) |
| `functions/api/_lib/answer.js` | General chat answer, wraps `model.js` |
| `functions/api/_lib/urlFetch.js` | Safe product-page fetch + HTMLRewriter extraction |
| `functions/api/_lib/pricing.js` | Single source of truth for money amounts -- placeholders, not real numbers |
| `functions/api/_lib/hash.js` | IP hashing for rate limiting / click dedup, raw IPs never stored |
| `functions/api/paypal/_shared.js` | Generalized PayPal helpers -- plain amount in/out, no hardcoded fee |
| `d1/schema.sql` | All tables -- `ad_submissions`, `chat_events`, `test_ads`, `credit_ledger` -- already applied to `prism-crm` |
| `wrangler.toml` | **Real for production now** (Build System v3 reads it for bindings on every branch build), also used for local `wrangler pages dev` emulation |
| `mem/current.md` | Locked decisions carry-forward -- **read this first**, especially the homepage freeze |
| `docs/run-ads-strategy-2026-09-16.md` | Full planning record for everything in this doc dated 17 September |
| `docs/handoff-2026-09-17.md` | Current handoff -- read this, not the 14 September one |
| `docs/ad-submission-backend.md` | Original backend setup detail (14 Sept, now partly superseded by the free-submission change) |
| `docs/publisher-key.md` | Third-party wiring and smoke test |
| `docs/ad-submission.md` | Creative rules and 0.65 / 120ms floors -- stale, describes the old niche/fee model |
| `docs/pricing.md` | Old intercept pricing model -- stale, predates the repositioning |
| `docs/aeo-strategy.md` | Canonical and crawler rules |
| `.cursor/rules/prism-pages-static.mdc` | Pages-only deploy |
| `.cursor/rules/cloudflare-pages-deploy.mdc` | Git via Pages tab, not Workers |

## Constraints that must not regress

- Repo root is the Pages output. Do not add Worker `main` or `[assets]`.
- One product line on the homepage. No support-bot or crisis-language metrics.
- Canonical: `https://prismpublication.com/` with no `www` and no query string.
- Keys stay on the server. Browser only draws HTML the publisher already trusts.
- New resource bindings go in `wrangler.toml`, not the dashboard -- Build System v3 will refuse the dashboard add anyway.
- No third-party service (email, analytics beyond GA, auth) without asking first -- came up again this session (an email-notification step was cut for exactly this reason).
