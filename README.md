# Prism Publication

Native contextual ads for independent AI chatbots. A labeled card when the user prompt closely matches a product. Silence when it does not.

This repository is the **single-product** static site and server-side SDK client, last updated **11 September 2026**. It is not a Workers app and not a multi-product hub.

**Live origin:** [https://prismpublication.com/](https://prismpublication.com/)  
**GitHub:** [northpointalliance/prismpublication-sept](https://github.com/northpointalliance/prismpublication-sept)

> **Read [mem/current.md](mem/current.md) before changing public HTML or CSS.** It's a carry-forward file of locked decisions from prior sessions (color, alignment, type scale, which pages must exist). The homepage was rebuilt from screenshots on 11 September 2026 and, as of this writing, conflicts with it in a couple of places — see "Known gaps" below.

## What it is

- **Site:** Cloudflare Pages, files at repo root (`index.html`, `css/`, `js/`).
- **Homepage:** hero + inline phone demo, toggled with a "Start a test" multi-step advertiser form (`switchView()` in `index.html`, no routing). Nav: Demo, Ad submission, Developers, Contact, Start a test.
- **Homepage demo:** phone-frame scripted thread (`js/demo.js`), not a free-text sandbox. Play/Reset replays a fixed two-turn travel script; the composer is disabled. Each ad turn still runs the real cosine matcher (floor **0.65**) against a local catalog to pick the card, but visitors cannot type their own prompt here.
- **SDK:** `sdk/prismClient.js`. Call `displayAd` from Node or a Worker after the assistant answers. It reads `sdk/catalog.json` on this Pages host. Optional Google Ad Manager fan-out via `sdk/gamClient.js`. No Prism-hosted secret key.
- **Money:** intercept buyers who already run AI campaigns. Bill served labeled cards only. Operator detail: [docs/pricing.md](docs/pricing.md).

## Known gaps (as of 11 September 2026)

- `index.html` has no JSON-LD in `<head>` and no SDK Q&A/matching-contract section. `docs/aeo-strategy.md` requires both. Not yet reconciled.
- `demo/index.html`, `ad-submission/index.html`, and `sitemap.xml` are deleted in the working tree, pending a decision on whether they're restored (`mem/current.md` currently lists the first two as part of the locked Pages set). Not part of [PR #12](https://github.com/northpointalliance/prismpublication-sept/pull/12).
- Two paragraphs in the "Start a test" form section are center-aligned; `mem/current.md` locks body copy to left-aligned.

## Public contract (quote these)

| Signal | Floor | If missed |
|---|---|---|
| Cosine similarity (prompt vs creative) | 0.65 | Return `null` |
| Match latency | Under 120ms | Fail closed to `null` |
| Disclosure | Sponsored, advertiser brand on the card | Creative fails review |

Do not invent fill rate or visitor counts on the homepage.

## Repo map

```
index.html                    Homepage: hero, inline phone demo, advertiser form
developers/index.html         SDK integration guide (displayAd, matching contract)
css/styles.css                Layout, demo card, phone chrome
js/demo.js                    Scripted phone-thread demo (local cosine matcher, fixed script)
sdk/prismClient.js            Server matcher against sdk/catalog.json
sdk/catalog.json              Public creatives on Pages
sdk/gamClient.js              Optional Google Ad Manager fan-out
mem/current.md                Locked decisions carry-forward — read before editing HTML/CSS
docs/architecture.md          System design and diagrams
docs/handoff.md               9 September 2026 GitHub handoff (superseded, kept for history)
docs/pricing.md               Intercept pricing (operator)
docs/ad-submission.md         Creative and brand-safety rules
docs/aeo-strategy.md          Canonicals, crawler rules, JSON-LD requirements
docs/affiliate-tracker.md     House affiliate program tracker
docs/publisher-key.md         How a third party wires fill on Pages
docs/PUBLISHER-SMOKE-TEST.md  Operator smoke: Pages, not login/Supabase
docs/archive/                 Retired documents (not linked from the site)
```

`ad-submission/`, `demo/`, and `sitemap.xml` are absent from this list on purpose — see "Known gaps" above.

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
