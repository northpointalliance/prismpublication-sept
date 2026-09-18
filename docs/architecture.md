# Architecture | Prism Publication (last updated 18 September 2026)

Single-product static site plus a server-side chat-ad client, backed by a Cloudflare-only stack: D1 for storage, Workers AI (or OpenAI, provider-swappable) for the general chat, PayPal for payment. The product is the site's own phone UI -- a general-purpose chat, open to anyone -- not a third-party chatbot SDK play; see "The repositioning" below.

**Only the visual identity is frozen** -- background color, font choice, base font sizes, site-wide, see [mem/current.md](../mem/current.md)'s FROZEN section for the exact, corrected wording. Copy, CTAs, and structure are explicitly **not** frozen and get corrected or rebuilt directly whenever they're wrong, confirmed repeatedly and acted on again 18 September 2026: `index.html` itself was restructured that day (see "The homepage/run-ads merge" below), not just text-edited. If a task looks like it needs a color, font-family, or base type-scale change, that's the one thing still worth asking about first.

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

## The homepage/run-ads merge (18 September 2026)

`/run-ads/` no longer exists as a page. `run-ads/index.html` is deleted; `/run-ads` and `/run-ads/` both 301-redirect to `/` via `_redirects`. Everything that used to live there is now on `index.html` itself, directly after the hero: the live chat (`section.demo-board`, `id="chat"`), then the ad-from-URL builder (`section.advertisers`, `id="build-ad"`). The old scripted, disabled-composer sandbox that used to be the homepage's own visitor experience is gone entirely -- the live chat is the homepage's demo now. `/demo/` is untouched and still runs its own separate scripted Play/Reset walkthrough for anyone who wants a zero-effort preview first.

Reasons this happened, in order: (1) a nav/footer audit found the top nav and footer link list had drifted inconsistently across every page (different item sets, different self-link handling); fixed with one canonical 5-item nav -- Chat, Run ads, Developers, Blog, Contact -- and one canonical 9-item footer list, on every non-admin page. (2) A separately-drafted Cowork plan to merge the homepage and run-ads collided with that same nav work; the two were reconciled and executed together rather than as competing rebuilds. (3) The ad-builder's own copy and button hierarchy initially still led with "draft an ad for me" (AI-assisted copywriting), which is backwards for the actual audience -- professional advertisers who already write their own copy and want to test it, not have it drafted. Fixed: "Write it myself" is the primary button (skips the AI call entirely, still requires the destination URL since it doubles as `test_ads.destination_url`), "Draft my ad instead" is secondary. (4) A persistent "Your test results" table was added under the ad-builder (not just a one-off chat note) logging every question asked, its score, and outcome while a test ad is active, since the actual audience wants a report to take back to their own creative process, not a transcript.

The "Run ads" nav item now points at `/#chat` (an anchor on the homepage) instead of a separate URL. Body-copy and footer links to the literal `/run-ads/` path across other pages were left as-is deliberately -- they still resolve through the redirect, nothing 404s.

## Stack summary

| Layer | What ships | What does not |
|---|---|---|
| Public site | `index.html`, `css/styles.css`, `js/demo.js` at repo root | No `/dist` output, no build step beyond the no-op |
| Host | Cloudflare Pages, Git from GitHub, **Build System v3** | Not Workers-as-a-separate-project, not Vercel |
| Build | `echo "Building static site"` | Not `npx wrangler deploy` or `wrangler pages deploy` -- git push is the only deploy path |
| Bindings | Read from `wrangler.toml` in the repo on every Git-connected build (Build System v3 -- confirmed via the dashboard refusing manual binding additions) | Not dashboard-added; the dashboard only still does secrets |
| Homepage live chat (moved onto `index.html` 18 Sept) | The site's real, free-text general chat -- `/api/chat`, any visitor, any topic, cards on contextual match only. This is now the homepage's own demo; `js/demo.js`'s scripted Play/Reset thread moved to `/demo/` only | No account, no login -- session state is a random id in `sessionStorage` |
| Advertiser self-test | `/api/match` -- an approved advertiser tests their own already-live ad against a question, content-match only, ignores credit state | No account needed, free either way |
| Ad-from-URL builder (17 Sept, reframed 18 Sept) | On `index.html`'s `#build-ad` section: "Write it myself" (primary) reveals empty brand/title/description/CTA fields directly, no AI call; "Draft my ad instead" (secondary) paste-a-URL -> `/api/draft-ad` drafts a suggestion -> edit -> either way, `/api/test-ad` saves it as that session's private test ad, scored in `/api/chat` alongside the public pool. A "Your test results" table logs every question/score/outcome for the session | No login, no payment for drafting or testing |
| Ad submission backend (14 Sept, screening + free 17 Sept) | `functions/api/submit.js` runs automated screening (`_lib/screening.js`, one model call, light-touch: only the prohibited-category list blocks outright, everything else routes to manual review) then writes to D1, **free**. `admin/index.html` reviews the queue. | No email/notification service, no third-party form handler, no Supabase/Vercel/Stripe |
| Go-live credit (17 Sept) | Once approved, the advertiser buys prepaid click credit on `functions/campaign/[token].js` (`/campaign/:token` -- their only way back, no account system) via PayPal. `_lib/matcher.js`'s `findBestAd` gates the chat pool on `credit_active`; `functions/c/[id].js` deducts a click's cost per click and deactivates on exhaustion. | No webhook (reuses the existing direct-capture-and-verify pattern); no refund automation (email request only) |
| Analytics | Google Analytics (GA4, property `G-22TDLD3N4E`) on every public page except `admin/`. Cloudflare's own Pages/Web Analytics also runs, dashboard-native, no code. | -- |
| Auth | None on the public site. `/admin/*` and `/api/submissions*` are gated by Cloudflare Access (dashboard-configured) plus a header check in the Function itself. Advertisers use a bookmarked `access_token` link instead of any login. | No Bearer key store; no custom login system |
| Payments (14 Sept, generalized 17 Sept) | `functions/api/paypal/{config,create-order,_shared}.js`. `_shared.js`'s `createOrder`/`captureOrder` take/return a plain amount now (no hardcoded fee) -- the caller validates against `_lib/pricing.js`'s allowed credit packs. Submission itself is free; the only PayPal flow left is buying credit. Currently **Sandbox mode**. | No Stripe (doesn't work in Israel); no client-trusted amount |

Default catalog: `PRISM_CATALOG_URL` or `https://prismpublication.com/sdk/catalog.json`. Third-party wiring and smoke results: [publisher-key.md](publisher-key.md).

## Entrypoint

1. Humans and crawlers: `index.html` at `/`. Hero states the identity plainly ("A live AI chat that shows contextual ads"), then the live chat itself, then two low-commitment links in priority order: "Already have an ad? Test it here, free" (`#build-ad`) before "Not ready to type? See a 30-second example first" (`/demo/`) -- the ad-testing path leads because it is the one that eventually turns into PayPal revenue.
2. Scripted demo: `/demo/` still runs `js/demo.js`'s fixed travel-thread Play/Reset script against the local catalog, composer disabled. No longer on the homepage.
3. Production fill: publisher Node or Worker imports `displayAd` from `sdk/prismClient.js` **after** the assistant finishes a complete thought.
4. Advertiser flow: chat with it, or go straight to `#build-ad` on the homepage (write your own copy or draft one from a URL, test free) -> `ad-submission/` (free, screened, returns an `access_token` link) -> once approved, `/campaign/{token}` to buy credit and go live.

There is no client-side view toggle on the homepage itself -- it's still one static page, just a longer one than before.

## Matcher state machine (unchanged mechanism, now also gated on credit)

Public floors: cosine **0.65**, match budget **under 120ms**. Miss or timeout: `null`. Null is not billable. `_lib/matcher.js` is shared by `/api/match` (advertiser self-test, `requireActive: false` -- content match, not billing state) and `/api/chat` (real serving, `requireActive: true` by default -- gated on `credit_active`).

**Two-tier pool (18 Sept):** `findBestAd` checks `ad_submissions` (plus any private test/draft ad) first; only if nothing there clears 0.65 does it fall back to `ad_library` rows with `source = 'affiliate'`. Paid always wins a tie -- a paying advertiser's card can't be outscored off the slot by an affiliate link that happens to share more words with the question. Affiliate rows have no `credit_active`/billing; a winning affiliate match is logged to `chat_events.matched_library_id` instead of `matched_ad_id`, and its card renders with an "Affiliate" label and links straight to `destination_url` (no `/c/:id` click-billing redirect -- there's no credit to draw down). `ad_library` also holds `source = 'paid'` rows that link an already-live `ad_submissions` campaign into the same table via `ad_submission_id` for future catalog/listing use; those aren't separately scored today since the linked submission is already in the primary pool.

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

## Sequence: scripted demo (`/demo/`, not the homepage anymore)

```
Visitor          demo/index.html  demo.js            Catalog (in-file)
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
Visitor    / (homepage chat)   /api/chat    /api/draft-ad    /api/test-ad    /ad-submission/    /api/submit    D1    Daniel/admin    /campaign/:token    /api/credit/purchase
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

Retired the $5-at-submission fee (14 Sept) entirely as of 17 Sept -- confirmed directly this was a real removal, not additive. **Submitting and testing a campaign is free.** The only charge: prepaid click credit, bought via `/campaign/{token}` once approved, billed per click, tracked as a ledger (`credit_ledger` -- balance is always `SUM(amount_cents)`, never a stored running total).

**18 September 2026: the advertiser sets their own budget, not a fixed pack.** `CREDIT_PACKS_CENTS` is gone -- replaced by `MIN_CREDIT_PURCHASE_CENTS` (500, i.e. $5.00, a real number Daniel confirmed) and `MAX_CREDIT_PURCHASE_CENTS` (a fat-finger guardrail, not a business limit) in `functions/api/_lib/pricing.js`. `PRICE_PER_CLICK_CENTS` is still an explicit placeholder. [pricing.md](pricing.md) was fully rewritten the same day to describe this real model -- no longer stale.

**Click-fraud guard, same day:** `functions/c/[id].js` used to bill any GET request with zero verification. It now only bills a click if (1) the exact session actually got that exact ad served by `/api/chat` first, and (2) that session hasn't already billed a click on that ad. Neither check blocks the redirect, only the billing.

**House ads, same day:** `/admin/` has a "Go live free (house ad)" action on any approved submission, for Daniel's own inventory (his other site, devorahsart.com) where buying PayPal credit from himself makes no sense. Inserts a normal `credit_ledger` purchase row with no PayPal capture behind it, admin picks the amount. Behaves identically to a paid campaign from that point on. See `functions/api/submissions/[id]/house-credit.js`.

## Key files

| Path | Role |
|---|---|
| `index.html` | Product page, JSON-LD, identity-first hero, the live chat, the ad-builder (`#build-ad`, write-your-own or draft-from-URL), the test-results report. Visual identity frozen (colors/fonts/type scale); structure and copy are not, and changed substantially 18 September |
| `css/styles.css` | Light-blue marketing tokens, hero highlights, demo card, chat bubbles |
| `js/demo.js` | Scripted phone-thread demo (travel packing), local cosine catalog, Play/Reset |
| `sdk/prismClient.js` | Server `displayAd` against static `sdk/catalog.json` |
| `sdk/catalog.json` | Public creatives on Pages, used only by the homepage demo |
| `sdk/gamClient.js` | GAM demand leg (fill URL, network, ad unit) |
| `blog/` | 17 posts + index, own template instance of the same foundation |
| `ad-submission/index.html` | Free submission form, screened server-side, returns a campaign access-token link |
| `admin/index.html` | Submission review queue, Cloudflare Access-gated |
| `functions/campaign/[token].js` | Advertiser's one page: status, and once approved, buy-credit checkout |
| `functions/api/submit.js` | Public: screen, then free insert into D1, returns `access_token` |
| `functions/api/chat.js` | Public: general chat answer + contextual card, rate-limited via D1 |
| `functions/api/draft-ad.js` | Public: fetch a URL safely, draft a card via the model (suggestion only) |
| `functions/api/test-ad.js` | Public: save the (edited) draft as the session's private test ad |
| `functions/api/match.js` | Public: advertiser self-test, content match only, ignores credit state |
| `functions/api/credit/purchase.js` | Public: verify token + approval, capture PayPal payment, credit the ledger |
| `functions/c/[id].js` | Public: card-click redirect, click-fraud-gated (needs a genuine prior chat match, one billable click per session per ad), deducts credit, deactivates on exhaustion |
| `functions/api/submissions/{index,[id]}.js` | Access-gated: list / approve / reject |
| `functions/api/submissions/[id]/house-credit.js` | Access-gated: grant no-charge credit to an approved submission (Daniel's own inventory) |
| `functions/api/_lib/matcher.js` | Shared cosine matcher, `requireActive` option gates on credit |
| `functions/api/_lib/screening.js` | Automated screening -- light-touch, prohibited-category block only |
| `functions/api/_lib/model.js` | Shared "call whichever model is configured" (OpenAI or Workers AI), both paths now timeout-bounded (15s) after an untimed hang crashed `draft-ad.js` with a useless generic error |
| `functions/api/_lib/answer.js` | General chat answer, wraps `model.js`. System prompt carries a ground-truth fact block (self-corrects fabrication about the site/business) and an explicit content boundary (no sexual/explicit/violent/illegal content on this general-audience, no-age-gate chat) |
| `functions/api/_lib/urlFetch.js` | Safe product-page fetch + HTMLRewriter extraction |
| `functions/api/_lib/pricing.js` | Single source of truth for money amounts -- `MIN_CREDIT_PURCHASE_CENTS` (real, $5.00) and `MAX_CREDIT_PURCHASE_CENTS` (guardrail) replace the old fixed packs; `PRICE_PER_CLICK_CENTS` still a placeholder |
| `functions/api/_lib/hash.js` | IP hashing for rate limiting / click dedup, raw IPs never stored |
| `functions/api/paypal/_shared.js` | Generalized PayPal helpers -- plain amount in/out, no hardcoded fee |
| `d1/schema.sql` | All tables -- `ad_submissions`, `chat_events`, `test_ads`, `credit_ledger` -- already applied to `prism-crm` |
| `wrangler.toml` | **Real for production now** (Build System v3 reads it for bindings on every branch build), also used for local `wrangler pages dev` emulation |
| `mem/current.md` | Locked decisions carry-forward -- **read this first**, especially the homepage freeze |
| `docs/run-ads-strategy-2026-09-16.md` | Full planning record for everything in this doc dated 17 September |
| `docs/handoff-2026-09-18.md` | Current handoff -- read this, not the 17 or 14 September ones |
| `docs/ad-submission-backend.md` | Original backend setup detail (14 Sept, now partly superseded by the free-submission change) |
| `docs/publisher-key.md` | Third-party wiring and smoke test |
| `docs/ad-submission.md` | Creative rules and 0.65 / 120ms floors -- stale, describes the old niche/fee model |
| `docs/pricing.md` | Real pricing model as of 18 September -- rewritten, no longer stale |
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
- Every non-admin page shares the same top nav (Chat, Run ads, Developers, Blog, Contact) and the same 9-item footer link list, in that order, hand-copied per page since there is no shared partial/template mechanism on this static host. A page-specific nav/footer edit almost certainly needs to be made on all ~23 pages, not just one -- check for drift with a quick diff across pages before assuming a single-file edit is enough.
- `run-ads/index.html` is retired. Do not recreate it as a live page without an explicit decision to do so -- `/run-ads` and `/run-ads/` are meant to redirect to `/`.
