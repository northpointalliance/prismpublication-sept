# Carry-forward | prismpublication-sept

This repo is the live static site. It is not the hub. There is no `apps/memory` Worker here. Next session starts from this file, not from another rebuild.

## FROZEN (13 September 2026) — read this before touching anything

Daniel has spent repeated sessions rebuilding this homepage across different tools (Cursor, Cowork, Gemini) and wants that to stop. **The homepage exactly as it exists on `main` right now — this `index.html`, `css/styles.css`, `js/demo.js`, nav, copy, colors, and the phone demo — is the permanent baseline.** Do not redesign it, restructure it, re-theme it, or rewrite its copy on your own initiative, no matter how it was reached ("this is more correct," "this reads better," matching a mockup someone pasted in). If a task seems to require changing the homepage's look, structure, or copy, stop and ask first.

A separate branch/PR (`cursor/prefilled-demo-thread`, PR #12) rebuilt this homepage from a different tool's output and was **closed without merging** on 13 September 2026 for exactly this reason. Do not resurrect it, cherry-pick from it, or treat its existence as evidence the homepage should change.

**The only new work permitted right now (all shipped 14 September 2026):**
- A blog — `blog/`, 15 posts + index
- Legal pages — `privacy/`, `terms/`, linked in every footer. Terms states Israeli governing law, confirmed directly with Daniel, not inferred.

No more items queued here as of 14 September. Next new-page work needs an explicit ask, same as everything else past the freeze.

**One foundation, no exceptions (14 September 2026):** every page on this site — the frozen homepage, `demo/`, `ad-submission/`, `developers/`, `blog/`, and any future page — loads the same `css/styles.css` and reuses the same header/nav/footer HTML structure, fonts, and colors. A new page is new copy inside the existing template, never a new design. `blog/` follows this already: it loads `css/styles.css` plus a small *additive* `css/blog.css` for the few elements the homepage doesn't have (cover image, pull-quote), and nothing in `css/blog.css` overrides or duplicates a rule from `css/styles.css`. Any future add-on (legal pages included) must work the same way.

New pages are additive — their own files. They do not touch `index.html`, `css/styles.css`, or `js/demo.js`'s existing content, beyond adding a nav/footer link to the new pages if asked (done for `blog/` in PR #15 — every page's nav and footer now links to it).

## Payment (built 14 September 2026)

Submitting a campaign is a paid step: **$5.00 flat fee via PayPal**,
verified server-side before the D1 row is ever written. Covers review +
unlimited testing on that campaign in `/run-ads/`. PayPal Client ID and
Secret are in Cloudflare Pages production environment variables
(Secret-type), account dan73ros@gmail.com, currently in **Sandbox mode**
(`PAYPAL_MODE` unset defaults to sandbox) -- no real money moves yet.

How it works: `ad-submission/`'s form validates client-side, then shows
PayPal Buttons (`functions/api/paypal/config.js` serves the public
Client ID, `functions/api/paypal/create-order.js` creates a
server-authoritative $5.00 order). On approval, `functions/api/submit.js`
calls `captureOrder` (`functions/api/paypal/_shared.js`) to verify the
capture actually completed at exactly $5.00 USD *before* touching D1 --
a submission is never written on unverified payment. `paypal_order_id`
and `amount_paid_cents` are stored per row and shown in `/admin/`.

**Not yet done:** switch `PAYPAL_MODE` to `live` when ready for real
money (one Cloudflare env var, no code change) -- do this only when
Daniel explicitly says to, and only after at least one real sandbox
test transaction has been run end-to-end.

## Backend (added 14 September 2026)

This site is no longer *pure* static. `ad-submission/index.html` now posts to
`functions/api/submit.js` (a Cloudflare Pages Function, i.e. a Worker that
deploys as part of this Pages project, not a separate Worker), which writes
to the `prism-crm` D1 database. `admin/index.html` reviews submissions,
protected by Cloudflare Access. Full detail, including the one-time
dashboard setup this still needs: [docs/ad-submission-backend.md](../docs/ad-submission-backend.md).
This was a deliberate, requested unlock -- it does not reopen the homepage
freeze above, and it did not use Supabase, Vercel, Stripe, or any
third-party API/secret. Do not add a third-party service (email sender,
form handler, auth provider) to this flow without asking; the whole point
was avoiding exactly that.

`functions/api/match.js` (added 14 September 2026, for `/run-ads/` below) is
now a plain HTTP matching endpoint any language can call with a POST -- but
it matches against the D1 `ad_submissions` approved pool, not
`sdk/catalog.json`. It happens to be the same *pattern* a non-JS publisher
integration would need, but it is not that integration. Still not built: an
endpoint that matches against `sdk/catalog.json` itself for publishers.

**`/run-ads/` (added 14 September 2026, rebuilt as a general chat 17
September 2026):** a second, separate phone-UI page -- not the homepage
demo, which stays exactly as frozen above. Two different things now live
here:
- `functions/api/match.js` -- advertiser self-test, unchanged. An advertiser
  types a question relevant to their own product and sees if their own
  approved card clears the floor. No account, ephemeral, nothing logged.
- `functions/api/chat.js` -- the actual `/run-ads/` chat widget as of 17
  September 2026. General-purpose, like a normal AI chat, not restricted to
  any niche or topic (see "MVP repositioning" below). Answers via
  `functions/api/_lib/answer.js`, matches via the same
  `functions/api/_lib/matcher.js` cosine matcher `match.js` uses (both share
  it now, no duplicated logic). Open to any visitor, no account, no
  advertiser gate.

## MVP repositioning (17 September 2026)

The fitness/sleep/productivity niches were an artifact of the earlier
third-party-chatbot-developer MVP (those were topics people actually chat
about with bots). That MVP is dead -- zero real installs. The current MVP
is the site's own phone UI, general-purpose like ChatGPT, sized for roughly
300-500 visitors, not a niche content site. Ads still only show when a
question contextually clears the 0.65 cosine floor (unchanged mechanism),
but the assistant itself is not topic-restricted, and the advertiser
category field is now free text gated by the brand-safety rules on
`/ad-submission/`, not a fixed niche whitelist. See
[docs/run-ads-strategy-2026-09-16.md](../docs/run-ads-strategy-2026-09-16.md)
for the full planning record and the staged build plan (Stage 2, the chat
itself, is what's described above; Stages 3-6 -- build-ad-from-URL,
automated screening, paid go-live, metrics -- are not built yet). Daniel
has also flagged that swapping the chat's answer model from Workers AI to
OpenAI is on the table if quality needs it -- `_lib/answer.js` is written
so that's an env-var change (`OPENAI_API_KEY`), not a rewrite.

**New D1 table `chat_events`** (see `d1/schema.sql`, needs one manual
`wrangler d1 execute prism-crm --remote` run against the real database):
logs each chat turn and each sponsored-card click. Also doubles as the
rate-limit store for `/api/chat` (10 messages/10min and 50/day per hashed
IP, 500/day site-wide) -- deliberately not a new KV namespace, traffic is
too low to need one. Chat question text is stored (unlike `/api/match`,
which stores nothing) -- `/run-ads/` now says so visibly, and
`privacy/index.html` was updated to match; keep those two in sync with
`chat.js` if the logging changes.

**New route `/c/:id`** (`functions/c/[id].js`): every sponsored card in the
chat links here instead of straight to the advertiser, so clicks get
logged before redirecting to `destination_url`. Needed later for the
credit/pay-per-click pricing model Daniel says is coming (not built yet,
still the flat $5 submission fee) -- built now because retrofitting click
tracking after ads start running is worse than having it from the start.

**Production bindings still needed for `/api/chat` to actually answer**
(dashboard-only, `wrangler.toml` is local-dev emulation): a Workers AI
binding named `AI` (Pages project -> Settings -> Functions -> Bindings),
and ideally a real `IP_HASH_SALT` secret. Without the `AI` binding (and no
`OPENAI_API_KEY`), `/api/chat` still matches ads correctly but returns a
"not configured yet" answer text instead of a real one -- check this is
set before calling the chat "live."

## Locked public site

- Origin: https://prismpublication.com/
- Host: Cloudflare Pages on GitHub `main`. Build `echo "Building static site"`. Never `wrangler pages deploy` or `wrangler deploy` -- Git push is the only deploy path. `wrangler pages dev` locally is fine (it's not a deploy).
- Pages: `index.html`, `demo/index.html`, `developers/index.html`, `ad-submission/index.html`, `blog/` (index + 15 posts), `admin/index.html` (Access-protected), `run-ads/index.html` (general live chat + advertiser ad-testing, separate from the homepage demo), `privacy/index.html`, `terms/index.html`, `css/styles.css`.
- Visitor demo is the **phone thread** (Play/Reset, composer off). Not the category form.
- One page paint only: `#f0f9ff` on html, body, header, main, footer, sections, containers, cards, tables. No `--section` / `--card-bg` second wash. Buttons may use accent. Phone chrome and in-thread cards stay device UI, not page paint.
- Alignment: paragraphs and long copy **left**. Headlines (h1/h2) and CTA groups **center**. No justify. No right-aligned body.
- Measure: body lines about **75ch**. Body type **1.125rem** (never under 16px), `#1e293b` on `#f0f9ff`.
- Contrast: normal text ≥ 4.5:1, large text ≥ 3:1. Links `#075985`, muted/headings `#0c4a6e`.
- Hierarchy: h1 800, h2 700, labels 700, CTAs 700 and ≥44px tall, body 400. Underlined in-copy links. That order is how attention should move.
- Phone stays a centered object; bubbles inside it stay left.

## Rejected (do not restore)

- Homepage matcher form (`#sandbox-form`, category select, Fitness/Sleep fill buttons)
- `js/sandbox.js` as the visitor experience (homepage loads `js/demo.js`)
- All-center or all-left lock on every section
- White slab cards that stripe the page
- `scripts/build-static.js`, `components/editor.js` leftover kit
- Worker / Supabase / Vercel / Prism-hosted key

## Unlock

Change public HTML or CSS only when Daniel says to. Then one commit to `main`, one Pages deploy. No palette passes.
