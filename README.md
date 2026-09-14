# Prism Publication

Native contextual ads for independent AI chatbots. A labeled card when the user prompt closely matches a product. Silence when it does not.

This repository is the **single-product** static site, a server-side SDK client, and (as of 14 September 2026) a real Cloudflare-only backend for ad submission and live testing. It is not a Workers-as-a-separate-project app and not a multi-product hub.

**Live origin:** [https://prismpublication.com/](https://prismpublication.com/)  
**GitHub:** [northpointalliance/prismpublication-sept](https://github.com/northpointalliance/prismpublication-sept)

> **Read [mem/current.md](mem/current.md) before changing public HTML or CSS.** The homepage is frozen as of 13 September 2026 — no redesigns. New work is additive, own pages/files: the blog and the ad-submission backend already shipped this way; legal pages are still open. See mem/current.md's "Next up, blocked on Daniel" for the one thing waiting on real credentials (PayPal).

## What it is

- **Site:** Cloudflare Pages, files at repo root (`index.html`, `css/`, `js/`).
- **Homepage demo:** phone-frame scripted thread (`js/demo.js`), not a free-text sandbox. Play/Reset replays a fixed two-turn travel script; the composer is disabled. Each ad turn still runs the real cosine matcher (floor **0.65**) against a local catalog to pick the card, but visitors cannot type their own prompt here.
- **SDK:** `sdk/prismClient.js`. Call `displayAd` from Node or a Worker after the assistant answers. It reads `sdk/catalog.json` on this Pages host. Optional Google Ad Manager fan-out via `sdk/gamClient.js`. No Prism-hosted secret key.
- **Money:** intercept buyers who already run AI campaigns. Bill served labeled cards only. Operator detail: [docs/pricing.md](docs/pricing.md).
- **Ad submission backend (added 14 September 2026):** `ad-submission/index.html` posts to a Cloudflare Pages Function (`functions/api/submit.js`), which writes to D1. `admin/index.html` reviews the queue, protected by Cloudflare Access. No third-party service, no API key. Full detail: [docs/ad-submission-backend.md](docs/ad-submission-backend.md).
- **Live ad testing (added 14 September 2026):** `run-ads/index.html` is a second, separate phone-UI chat (the homepage demo is untouched) where an advertiser types real questions and `functions/api/match.js` runs the live cosine matcher against the pool of **approved** D1 submissions. This is the actual "submit → get approved → test it live" loop. Every page's nav "Run ads" link now points here (it used to point at a homepage anchor — see "Known gaps" below) and `ad-submission/`'s hero CTA also links here.
- **Blog (added 14 September 2026):** `blog/` — 15 posts + index, migrated from an abandoned Desktop draft, restyled onto this site's own foundation. Linked from every page's nav.
- **Analytics (restored 14 September 2026):** Google Analytics (`G-22TDLD3N4E`) on every public page except `admin/`. It existed before but was missing from the live repo — lost in an earlier rebuild, not a new addition.
- **Pricing (live, Sandbox mode, 14 September 2026):** submitting a campaign costs a flat **$5.00 via PayPal**, verified server-side (`functions/api/paypal/`) before anything is written to D1. Covers review + unlimited `/run-ads/` testing. Currently in PayPal Sandbox (no real money) — switch `PAYPAL_MODE` to `live` when ready. See mem/current.md.

## Public contract (quote these)

| Signal | Floor | If missed |
|---|---|---|
| Cosine similarity (prompt vs creative) | 0.65 | Return `null` |
| Match latency | Under 120ms | Fail closed to `null` |
| Disclosure | Sponsored, advertiser brand on the card | Creative fails review |

Do not invent fill rate or visitor counts on the homepage.

## Repo map

```
index.html              Product page + JSON-LD
css/styles.css          Layout and demo card
css/blog.css            Additive: cover image, pull-quote (blog/ only, doesn't touch styles.css)
js/demo.js              Scripted phone-thread demo (local cosine matcher, fixed script)
blog/                   15 posts + index, same site foundation
ad-submission/index.html  Real submission form -> functions/api/submit.js
sdk/prismClient.js      Server matcher against sdk/catalog.json
sdk/catalog.json        Public creatives on Pages
docs/architecture.md    System design and diagrams
docs/handoff.md         9 September 2026 GitHub handoff (superseded, kept for history)
docs/handoff-2026-09-14.md  Current handoff -- read this one first
docs/pricing.md         Intercept pricing (operator)
docs/ad-submission.md   Creative and brand-safety rules
docs/aeo-strategy.md    Canonicals and crawler rules
docs/publisher-key.md   How a third party wires fill on Pages
docs/PUBLISHER-SMOKE-TEST.md  Operator smoke: Pages, not login/Supabase
docs/affiliate-tracker.md    House affiliate program tracker
docs/ad-submission-backend.md  Cloudflare Pages Function + D1 setup, incl. one-time dashboard steps
mem/current.md          Locked decisions carry-forward — read before editing HTML/CSS
functions/api/submit.js       Pages Function: public submission intake
functions/api/submissions/    Pages Function: admin list + approve/reject (Access-protected)
functions/api/match.js        Pages Function: live matcher for run-ads/, approved pool only
functions/api/paypal/config.js       Pages Function: serves the public PayPal Client ID
functions/api/paypal/create-order.js Pages Function: creates a server-authoritative $5.00 order
functions/api/paypal/_shared.js      PayPal API helpers (not a route -- imported by the above and submit.js)
admin/index.html        Submission review UI (Access-protected)
run-ads/index.html      Live ad-testing chat (separate from the homepage demo)
d1/schema.sql           ad_submissions table (already applied to prism-crm)
wrangler.toml           Local dev only -- not read by the Git-connected Pages build
```

## Deploy (Cloudflare Pages)

1. Dashboard: **Workers & Pages** → **Create** → **Pages** tab (not Workers).
2. Connect GitHub `northpointalliance` → this repository.
3. Build command: `echo "Building static site"` (never the word `none`).
4. Deploy command: `true` (or blank). Never `npx wrangler deploy`.
5. Output: repository root `/`.

Rules that enforce this: `.cursor/rules/prism-pages-static.mdc`, `.cursor/rules/cloudflare-pages-deploy.mdc`.

## Local preview

Serve the repo root over HTTP (any static server). Open `/` and press Play on the phone demo to watch the scripted travel thread render two sponsored Amazon cards; Reset replays it. A fill must not show cosine or millisecond text on the sponsored card.

## Known gaps

- **Approving a submission doesn't make it live.** `/admin/` only updates the D1 row's status. Getting an approved creative into `sdk/catalog.json` (what a real third-party publisher's SDK reads) is still a manual git edit. See [docs/ad-submission-backend.md](docs/ad-submission-backend.md).
- **PayPal is in Sandbox mode.** The $5 submission fee is live but not collecting real money yet — flip `PAYPAL_MODE` to `live` (one Cloudflare env var) when ready, only after a real sandbox test transaction has been run end-to-end. `docs/pricing.md`'s IO-negotiated rate remains the separate, real ad-serving price.
- **No non-JS publisher integration.** `sdk/prismClient.js` requires the publisher's own server to be Node/JS. `functions/api/match.js` is a plain HTTP endpoint any language could call, but it matches against D1 submissions, not `sdk/catalog.json` — same pattern, not the same integration.
- **The `Desktop\prismpublication*` folders and D1 databases (`prism-cms`, `prism-memory`) found during this session's cleanup are still unresolved** — not touched, not deleted, still sitting there from earlier abandoned attempts.

## Contact

[info@prismpublication.com](mailto:info@prismpublication.com)

Author: Daniel Rosenthal.
