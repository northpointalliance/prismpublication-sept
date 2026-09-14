# Prism Publication

Native contextual ads for independent AI chatbots. A labeled card when the user prompt closely matches a product. Silence when it does not.

This repository is the **single-product** static site and server-side SDK client as of **9 September 2026**. It is not a Workers app and not a multi-product hub.

**Live origin:** [https://prismpublication.com/](https://prismpublication.com/)  
**GitHub:** [northpointalliance/prismpublication-sept](https://github.com/northpointalliance/prismpublication-sept)

> **Read [mem/current.md](mem/current.md) before changing public HTML or CSS.** The homepage is frozen as of 13 September 2026 — no more redesigns. Only additive work (a blog, legal Terms & Conditions / Privacy pages) is in scope until Daniel says otherwise.

## What it is

- **Site:** Cloudflare Pages, files at repo root (`index.html`, `css/`, `js/`).
- **Homepage demo:** phone-frame scripted thread (`js/demo.js`), not a free-text sandbox. Play/Reset replays a fixed two-turn travel script; the composer is disabled. Each ad turn still runs the real cosine matcher (floor **0.65**) against a local catalog to pick the card, but visitors cannot type their own prompt here.
- **SDK:** `sdk/prismClient.js`. Call `displayAd` from Node or a Worker after the assistant answers. It reads `sdk/catalog.json` on this Pages host. Optional Google Ad Manager fan-out via `sdk/gamClient.js`. No Prism-hosted secret key.
- **Money:** intercept buyers who already run AI campaigns. Bill served labeled cards only. Operator detail: [docs/pricing.md](docs/pricing.md).
- **Ad submission backend (added 14 September 2026):** `ad-submission/index.html` posts to a Cloudflare Pages Function (`functions/api/submit.js`), which writes to D1. `admin/index.html` reviews the queue, protected by Cloudflare Access. No third-party service, no API key. Full detail: [docs/ad-submission-backend.md](docs/ad-submission-backend.md).
- **Live ad testing (added 14 September 2026):** `run-ads/index.html` is a second, separate phone-UI chat (the homepage demo is untouched) where an advertiser types real questions and `functions/api/match.js` runs the live cosine matcher against the pool of **approved** D1 submissions. This is the actual "submit → get approved → test it live" loop.

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
js/demo.js              Scripted phone-thread demo (local cosine matcher, fixed script)
sdk/prismClient.js      Server matcher against sdk/catalog.json
sdk/catalog.json        Public creatives on Pages
docs/architecture.md    System design and diagrams
docs/handoff.md         9 September 2026 GitHub handoff
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

## Contact

[info@prismpublication.com](mailto:info@prismpublication.com)

Author: Daniel Rosenthal.
