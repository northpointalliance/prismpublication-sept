# Publisher smoke test (Cloudflare Pages)

Operator checklist. Date of this run: **10 September 2026**. Not a public page.

This is the Pages version of the old publisher smoke (login, issued SDK key, Supabase `/ads`). **Do not** open Sign in, **do not** ask for a Bearer token, **do not** POST to a Supabase function.

Host: [https://prismpublication.com/](https://prismpublication.com/)  
Git: [northpointalliance/prismpublication-sept](https://github.com/northpointalliance/prismpublication-sept)  
How fill is wired: [publisher-key.md](publisher-key.md)

## What we dropped from the old smoke

| Old step | Pages step |
|---|---|
| Publisher landing → Sign up / Sign in | There is no account. Skip. A login form on this host is a failure. |
| Email a publisher key | No key. `displayAd({ topic })` only. |
| `Authorization: Bearer` against Supabase | `GET /sdk/catalog.json` (static file). |
| Badge `Sponsored · VIA PRISM` | Badge is **Sponsored · {advertiser}**. |
| Three niches + desktop dashboard | `/demo/` is one travel packing chat in a phone frame. |
| Fake 4.2% CTR as a KPI | Demo may show message/ad counts. Do not treat CTR as measured. |

## Live HTTP (this run)

| URL | Expect | 10 Sept 2026 |
|---|---|---|
| `/` | 200, no supabase, no `PRISM_API_KEY` | 200 |
| `/demo/` | 200, phone travel demo | 200 |
| `/developers/` | 200, catalog URL in copy | 200, mentions catalog |
| `/ad-submission/` | 200 | 200 |
| `/sdk/catalog.json` | 200, JSON `ads` array | 200, has ads |
| `/sdk/prismClient.js` | 200, fetches catalog, no supabase host | 200, mentions catalog |

## Human path (third party, no login)

1. Open [developers](https://prismpublication.com/developers/). Copy does **not** say wait for a key.
2. Confirm the sample is `displayAd({ topic: userQuestion })` with optional `gam`. No `apiKey`.
3. Open [catalog.json](https://prismpublication.com/sdk/catalog.json). You should see creatives, not an auth error.
4. Open [demo](https://prismpublication.com/demo/). Play. A labeled **Amazon** packing-cubes card can show. Weather-style lines should not.
5. Homepage sandbox: protein / sleep / productivity fills; Stay silent stays empty. Badge is advertiser brand.
6. Email `info@prismpublication.com` only if they want an IO or GAM, not a token.

## Matcher smoke (local, no network)

From repo root, Node 18+:

```powershell
node --input-type=module -e "import { readFileSync } from 'node:fs'; import { displayAd } from './sdk/prismClient.js'; const catalog = JSON.parse(readFileSync('sdk/catalog.json','utf8')); const protein = await displayAd({ topic: 'any protein powder recommendations for lifting', catalog }); const cubes = await displayAd({ topic: 'packing cubes for a carry-on trip', catalog }); const miss = await displayAd({ topic: 'what is the weather in lisbon tomorrow', catalog }); console.log(JSON.stringify({ protein: protein && protein.title, cubes: cubes && cubes.title, miss }, null, 2));"
```

Recorded **10 September 2026**:

| Topic | Result |
|---|---|
| protein / lifting | Protein powder for a training week |
| packing cubes | Packing cubes for a carry-on week |
| weather in Lisbon | `null` |

## Pass / fail

**Pass** if every live URL above is 200, catalog has `ads`, demo Play can serve a labeled advertiser card, developers do not ask for a Prism API key, and the matcher smoke matches the table.

**Fail** if you see Sign in, a Supabase URL, `Unauthorized SDK key`, `PRISM_API_KEY` in the public sample, or `Sponsored · VIA PRISM`.

## Failures to fix

1. If `/sdk/catalog.json` is 404, Pages has not deployed `main` yet. Merge and wait.
2. If developers HTML still mentions a publisher key, that copy is stale. Fix `developers/index.html`.
3. If `displayAd` POSTs anywhere except optional GAM, the SDK has regressed. `sdk/prismClient.js` must GET the Pages catalog (or use a passed-in catalog).
