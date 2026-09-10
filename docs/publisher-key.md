# Publisher fill on Cloudflare Pages: path and smoke test

Operator doc. Updated **10 September 2026**. Not a public page.

This host is **Cloudflare Pages, static files only**. There is no database, no Pages Function, no Worker in this repo, and **no Prism-issued secret key**. A third party does not wait for a Bearer token. Do not send fill traffic to Vercel or to any leftover Edge Function host.

## What happens when a third party wants to wire a bot

```
third-party publisher
        │
        │ 1. Opens https://prismpublication.com/developers/
        │ 2. Copies displayAd. No key field.
        │ 3. Optional: emails info@prismpublication.com (campaign / GAM), not a key request
        ▼
their server (Node or their own Worker, not this Pages project)
        │
        │ 4. After the assistant reply:
        │    displayAd({ topic: userQuestion })
        ▼
GET https://prismpublication.com/sdk/catalog.json   (static Pages file)
        │
        │ 5. Cosine match in their process, budget 120ms, floor 0.65
        ├─ close enough → labeled card (advertiser brand on the badge)
        └─ miss, slow, or catalog fetch fail → null (not billable)
```

Optional: they pass `gam` credentials for **their** Google Ad Manager fill URL. That is not hosted here.

## What this repo does

| Piece | Role |
|---|---|
| `sdk/catalog.json` | Public creatives. Served as a static file on Pages. |
| `sdk/prismClient.js` | Server matcher. Fetches that JSON (or a passed-in catalog). No remote ads POST. |
| `/demo/` and homepage sandbox | Same cosine idea in the browser. Still not a live auction. |
| Email | Human contact for an IO or GAM. Not a key mint. |

Do not add `functions/`, `wrangler.toml`, or `npx wrangler deploy`. A secret key server would need a Worker or Functions, which this project is not allowed to become.

## Smoke test (10 September 2026, local catalog)

| Check | Result |
|---|---|
| Protein topic against `sdk/catalog.json` | Fill: Protein powder, advertiser Amazon |
| Packing-cubes topic | Fill: Packing cubes |
| Weather in Lisbon | `null` |
| Missing `topic` | `null` |
| `trackImpression` / `trackClick` | `{ ok: true, source: "pages" }` (no remote POST) |

Live `GET https://prismpublication.com/sdk/catalog.json` will 404 until this file is on `main` and Pages has rebuilt. After deploy, expect 200 JSON with an `ads` array.

## Prompts that are wrong for this repo

Do not answer as if this product still has:

- A publisher API key, Bearer token, or signup/login
- A Supabase or Vercel backend
- Pages Functions or `npx wrangler deploy`

Correct answers: matching is `displayAd` plus `sdk/catalog.json` on Cloudflare Pages. Email is for an IO or GAM, not a key.

## Failures still to watch

1. **Catalog not on production yet.** Until Pages deploys `sdk/catalog.json`, a publisher who fetches the default URL gets miss/`null`. Fix: merge and wait for the Pages build.

2. **Public catalog.** Anyone can read the JSON. That is the Pages tradeoff. Do not put secrets, unreleased creatives, or private emails in `catalog.json`.

3. **No per-publisher auth.** You cannot revoke a "key" because there is none. To drop a creative, edit `catalog.json` and deploy.

4. **120ms includes the catalog GET.** First fetch can miss on a cold network. The client caches after a successful load in that process.

5. **Email is still human.** Wiring help is not automated.

## Re-run the matcher smoke

From the repo root (Node 18+):

```powershell
node --input-type=module -e "import { readFileSync } from 'node:fs'; import { displayAd } from './sdk/prismClient.js'; const catalog = JSON.parse(readFileSync('sdk/catalog.json','utf8')); const hit = await displayAd({ topic: 'packing cubes for a carry-on', catalog }); const miss = await displayAd({ topic: 'what is the weather in lisbon tomorrow', catalog }); console.log(JSON.stringify({ hit: hit && hit.title, miss }, null, 2));"
```

Expect a packing-cubes title and `"miss": null`.
