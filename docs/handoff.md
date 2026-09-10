# GitHub handoff | 9 September 2026

Handoff for [northpointalliance/prismpublication-sept](https://github.com/northpointalliance/prismpublication-sept). Audience: whoever clones, reviews a PR, or wires Cloudflare Pages. Read [architecture.md](architecture.md) and the root [README.md](../README.md) with this file.

## Snapshot

| Item | Status on 9 Sept 2026 |
|---|---|
| Product | Native labeled chat ads for independent bots |
| Host | Cloudflare Pages, static root, no Wrangler Worker |
| Default branch on remote | `main` at initial clean release `1d415df` |
| Working branch | `add-pages-static-deploy-rule` (pushed; includes Pages rules + hero copy) |
| Public floors | Cosine 0.65, match under 120ms, sponsored label with advertiser brand |
| Billing model (operator) | Intercept active AI campaign buyers; null not billable |

Remote after the hero push: `02c2172` on `origin/add-pages-static-deploy-rule`.

## What shipped this day (git)

1. **`1d415df`** Initial clean release: static landing page, sandbox, Cursor rules, SDK client.
2. **`e100e66`** Always-on Pages static deploy rule so Worker / Wrangler configs cannot regress.
3. **`e59bc36`** Pages Git setup rule so deploys use the Pages tab, not the Workers UI.
4. **`02c2172`** Homepage hero rewritten for monetization benefits (relevance, speed, keys on server, no ad tags).

## What was done this day but may still be uncommitted

Confirm with `git status` before you merge. As of this handoff these lived on disk and were **not** in `git ls-files`:

| Change | Why it matters |
|---|---|
| `docs/pricing.md` | Intercept pricing: CPC / rendered impression / IO. No public dollar figures. |
| `docs/ad-submission.md` | Link to pricing; budgets still required. |
| `js/sandbox.js` | Sponsored card no longer prints cosine, Amazon, or ms. |
| `docs/architecture.md`, `docs/handoff.md`, `README.md` | This documentation set. |
| `.cursor/skills/prism-gam.skill` | Product skill: talk to GAM / Google Ad Manager ad ops without treating Prism as a GAM replacement. Track this file. |

If those files are still unstaged, commit them on `add-pages-static-deploy-rule` (or a docs branch) before calling the day closed.

## How to take over on GitHub

```text
git clone https://github.com/northpointalliance/prismpublication-sept.git
cd prismpublication-sept
git checkout add-pages-static-deploy-rule
git status
```

Open a PR into `main` when Pages rules, hero, sandbox card, pricing, and this docs set are all on the branch you want to ship. PR body: Summary + Test plan (sandbox fills, null path, view-source hero, Pages build command).

Production Pages project should track the branch Cloudflare already uses. If production is `main`, merge; do not force-push `main`.

## Pages settings to verify in Cloudflare

- Project type: **Pages**, GitHub connected.
- Build command: `echo "Building static site"`.
- Deploy command: `true` or empty.
- Root directory: `/` (repo root).
- No `wrangler.toml`, no Functions.

## Test plan (human)

1. Open `/`. Hero reads as benefits, not cosine jargon.
2. Sandbox Fitness fill: protein card, **Sponsored · Amazon**, Shop on Amazon, **no** cosine/ms footer.
3. Below 0.65: null / no fill. Assistant-reply-still-ships copy is allowed here.
4. View-source: hero, niches, SDK Q&A, JSON-LD present without running the sandbox.
5. Confirm `sdk/prismClient.js` is not loaded by `index.html`.

## Do not

- Copy from other Prism clones or harvest folders into this tree.
- Mix support-bot / Signals / crisis metrics onto this homepage.
- Put API keys in the browser.
- Publish CPC, take rate, or fill rate on `index.html` until an IO exists.
- Deploy with Wrangler as a Worker.

## Open after 9 Sept

- Merge `add-pages-static-deploy-rule` → `main` once uncommitted docs and sandbox fix are on the branch.
- Issue publisher keys by email until a billing desk exists.
- First intercept IO: map one live AI campaign into fitness, sleep, or productivity per [ad-submission.md](ad-submission.md).
- `scripts/build-static.js` / CMS editor: leave unused or delete in a later cleanup PR. Not required for Pages.

Questions: [info@prismpublication.com](mailto:info@prismpublication.com).
