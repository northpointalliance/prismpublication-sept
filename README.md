# Prism Publication

Native contextual ads for independent AI chatbots. A labeled card when the user prompt closely matches a product. Silence when it does not.

This repository is the **single-product** static site and server-side SDK client as of **9 September 2026**. It is not a Workers app and not a multi-product hub.

**Live origin:** [https://prismpublication.com/](https://prismpublication.com/)  
**GitHub:** [northpointalliance/prismpublication-sept](https://github.com/northpointalliance/prismpublication-sept)

## What it is

- **Site:** Cloudflare Pages, files at repo root (`index.html`, `css/`, `js/`).
- **Sandbox:** in-browser prompt matcher (`js/sandbox.js`). Cosine floor **0.65**. Matching budget **under 120ms**. Local catalog only.
- **SDK:** `sdk/prismClient.js`. Call `displayAd` from Node or a Worker after the assistant answers. Bearer key never goes in the chat widget.
- **Money:** intercept buyers who already run AI campaigns. Bill served labeled cards only. Operator detail: [docs/pricing.md](docs/pricing.md).

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
css/styles.css          Layout and sandbox card
js/sandbox.js           Local matcher
sdk/prismClient.js      Server client (displayAd, track)
docs/architecture.md    System design and diagrams
docs/handoff.md         9 September 2026 GitHub handoff
docs/pricing.md         Intercept pricing (operator)
docs/ad-submission.md   Creative and brand-safety rules
docs/aeo-strategy.md    Canonicals and crawler rules
```

`scripts/build-static.js` and `components/editor.js` are leftover kit. Pages does not run them.

## Deploy (Cloudflare Pages)

1. Dashboard: **Workers & Pages** → **Create** → **Pages** tab (not Workers).
2. Connect GitHub `northpointalliance` → this repository.
3. Build command: `echo "Building static site"` (never the word `none`).
4. Deploy command: `true` (or blank). Never `npx wrangler deploy`.
5. Output: repository root `/`.

Rules that enforce this: `.cursor/rules/prism-pages-static.mdc`, `.cursor/rules/cloudflare-pages-deploy.mdc`.

## Local preview

Serve the repo root over HTTP (any static server). Open `/`. Run Fitness fill / Below 0.65 in the sandbox. A fill must not show cosine or millisecond text on the sponsored card.

## Contact

[info@prismpublication.com](mailto:info@prismpublication.com)

Author: Daniel Rosenthal.
