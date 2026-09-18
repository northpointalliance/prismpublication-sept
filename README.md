# Prism Publication

Native contextual ads for independent AI chatbots, and -- as of 17 September 2026 -- the site's own general-purpose phone UI where anyone can chat, draft an ad from a product URL, test it free, and go live on prepaid click credit (advertiser sets their own budget, $5.00 minimum, not a fixed pack). A labeled card when the user's message closely matches a product. Silence when it does not.

This repository is the **single-product** static site, a server-side SDK client, and a real Cloudflare-only backend (D1, Workers AI/OpenAI, PayPal). It is not a Workers-as-a-separate-project app and not a multi-product hub.

**Live origin:** [https://prismpublication.com/](https://prismpublication.com/)
**GitHub:** [northpointalliance/prismpublication-sept](https://github.com/northpointalliance/prismpublication-sept)

> **Read [mem/current.md](mem/current.md) before changing public HTML or CSS.** The freeze, scope clarified 17 September 2026, is on the site's **visual identity** only: background color, font choice, base font sizes, site-wide. Copy, CTAs, and structure are not frozen and get corrected directly when wrong, already precedented repeatedly. Only a color/font/type-scale change needs asking first.

## What it is

- **Site:** Cloudflare Pages, files at repo root (`index.html`, `css/`, `js/`), **Build System v3** -- bindings come from `wrangler.toml` in the repo now, not the dashboard.
- **Homepage demo:** phone-frame scripted thread (`js/demo.js`), not a free-text sandbox. Play/Reset replays a fixed script; the composer is disabled. Untouched by everything below.
- **The MVP (repositioned 17 September 2026):** the site's own phone UI on `/run-ads/` -- a general-purpose chat, open to anyone, any topic, sized for roughly 300-500 visitors. Not a niche content site; the earlier fitness/sleep/productivity framing was an artifact of an abandoned third-party-chatbot-developer MVP with zero real installs. Ads still only show on real contextual match (cosine floor **0.65**, unchanged).
- **Build your own ad ad on `/run-ads/`:** paste a product URL, get a drafted card, edit it, test it free in the same chat (scored privately, never shown to other visitors), then submit it for review -- free.
- **Ad submission (free as of 17 September 2026):** `ad-submission/index.html` posts to `functions/api/submit.js`, which runs light-touch automated screening (`_lib/screening.js` -- only a genuinely prohibited category blocks outright; everything else routes to manual review) and writes to D1, no charge. Returns a bookmarkable `access_token` link -- there's no account system, so that link is the advertiser's only way back.
- **Going live: prepaid click credit.** Once approved, the advertiser buys a credit pack on their own `/campaign/{token}` page via PayPal. Each click deducts from the balance; the card deactivates automatically when credit runs out. Pricing (`functions/api/_lib/pricing.js`) is **explicit placeholder** values, not real numbers yet.
- **SDK:** `sdk/prismClient.js`. Call `displayAd` from Node or a Worker after the assistant answers. Reads `sdk/catalog.json` on this Pages host -- a separate, unused-by-the-main-loop catalog. Optional Google Ad Manager fan-out via `sdk/gamClient.js`. No Prism-hosted secret key.
- **Blog:** `blog/` -- 15 posts + index, own template instance of the same foundation.
- **Analytics:** Google Analytics (`G-22TDLD3N4E`) on every public page except `admin/`.

## Public contract (quote these)

| Signal | Floor | If missed |
|---|---|---|
| Cosine similarity (prompt vs creative) | 0.65 | Return `null` |
| Match latency | Under 120ms | Fail closed to `null` |
| Disclosure | Sponsored, advertiser brand on the card | Creative fails review |

Do not invent fill rate, visitor counts, or pricing numbers -- the two credit-pricing constants are explicitly marked placeholder in code for this reason.

## Repo map

```
index.html                     Product page + JSON-LD (frozen)
css/styles.css                 Layout, demo card, chat bubbles
css/blog.css                   Additive: cover image, pull-quote (blog/ only)
js/demo.js                     Scripted phone-thread demo (frozen)
blog/                          15 posts + index, same site foundation
ad-submission/index.html       Free, screened submission form -> functions/api/submit.js
run-ads/index.html             General chat + advertiser self-test + ad-from-URL builder
admin/index.html               Submission review UI (Access-protected)
sdk/prismClient.js             Server matcher against sdk/catalog.json (separate, unused-by-main-loop)
sdk/catalog.json               Public creatives on Pages, homepage-demo only
functions/campaign/[token].js  Advertiser's one page: status + buy-credit checkout
functions/api/submit.js        Screen, then free insert into D1
functions/api/chat.js          General chat answer + contextual card
functions/api/draft-ad.js      Safe URL fetch + AI-drafted ad card (suggestion only)
functions/api/test-ad.js       Save the edited draft as a private test ad
functions/api/match.js         Advertiser self-test, content match only
functions/api/credit/purchase.js  Verify + capture + credit the ledger
functions/c/[id].js            Card-click redirect: logs + deducts credit
functions/api/submissions/     Admin list + approve/reject (Access-protected)
functions/api/_lib/            Shared: matcher, screening, model provider, URL fetch, pricing, hashing
functions/api/paypal/          Generalized PayPal helpers (plain amount, no hardcoded fee)
d1/schema.sql                  All tables, already applied to prism-crm
wrangler.toml                  Real for production (Build System v3 reads it) + local dev
mem/current.md                 Locked decisions carry-forward -- read before editing HTML/CSS
docs/architecture.md           System design and diagrams -- current state
docs/run-ads-strategy-2026-09-16.md  Full planning record for the 17 Sept rebuild
docs/handoff-2026-09-18.md     Current handoff -- read this one first
docs/handoff-2026-09-17.md     Superseded -- kept for history
docs/handoff-2026-09-14.md     Superseded -- kept for history
docs/pricing.md                Real pricing model as of 18 Sept -- rewritten, current
docs/ad-submission.md          Stale -- describes the old niche/fee model
docs/aeo-strategy.md           Canonicals and crawler rules
docs/publisher-key.md          How a third party wires fill on Pages
docs/affiliate-tracker.md      House affiliate program tracker
```

## Deploy (Cloudflare Pages)

1. Dashboard: **Workers & Pages** -> Pages project, GitHub-connected, **Build System v3**.
2. Build command: `echo "Building static site"`. Deploy command: `true` (or blank). Output: repo root `/`.
3. Bindings (D1 as `DB`, Workers AI as `AI`) come from `wrangler.toml` in the repo -- add new ones there, not the dashboard (it refuses manual additions under Build System v3).
4. Secrets (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `IP_HASH_SALT`, optional `OPENAI_API_KEY`) still go in the dashboard, under **Variables and secrets** -- a different section from Bindings.

Rules that enforce the Pages-only part: `.cursor/rules/prism-pages-static.mdc`, `.cursor/rules/cloudflare-pages-deploy.mdc`.

## Local preview

Serve the repo root over HTTP (any static server) for the static pages. `wrangler pages dev .` emulates the D1/AI bindings from `wrangler.toml` for the Functions. Open `/` and press Play on the phone demo to watch the scripted travel thread render two sponsored Amazon cards; Reset replays it. A fill must not show cosine or millisecond text on the sponsored card.

## Known gaps

- **Stage 5's billing logic is verified, the PayPal round-trip itself isn't.** The exact SQL `credit/purchase.js` and `c/[id].js` run was tested directly against production D1 (purchase → balance → click → auto-deactivate, all correct, test data cleaned up after). What's still unclicked: an actual PayPal order create → approve → capture, since that needs a human in a browser and this environment can't reach either `prismpublication.com` or PayPal's API to drive it. Confirmed acceptable to ship without that click-through for now -- do a real one whenever convenient.
- **`PRICE_PER_CLICK_CENTS` is still a placeholder** -- `functions/api/_lib/pricing.js`. `MIN_CREDIT_PURCHASE_CENTS` ($5.00) is real, confirmed 18 September.
- **Approving a submission doesn't make it live on `sdk/catalog.json`.** That's a separate, unused-by-the-main-loop catalog for third-party publishers; a real third-party integration would still need `sdk/catalog.json` edited by hand, or a new endpoint matching against it instead of D1.
- **No non-JS publisher integration.** `sdk/prismClient.js` requires the publisher's own server to be Node/JS.
- **`docs/ad-submission.md` is still stale**, describing the pre-repositioning niche/fee model -- `docs/pricing.md` was rewritten 18 September and is no longer on this list.
- **PayPal is still in sandbox mode.** Going live needs a live PayPal REST app (separate credentials from the sandbox ones currently in `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`), created by Daniel directly in the PayPal dashboard, plus `PAYPAL_MODE=live`. Discussed 18 September, not yet done.
- **The click-fraud guard doesn't stop a scripted attacker** who runs real chat turns through fresh session IDs in a loop -- `chat.js`'s own per-IP rate limits are the only thing bounding that, and there's no alerting if click volume looks suspicious, a manual admin-review gap.

## Contact

[info@prismpublication.com](mailto:info@prismpublication.com)

Author: Daniel Rosenthal.
