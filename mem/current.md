# Carry-forward | prismpublication-sept

This repo is the live static site. It is not the hub. There is no `apps/memory` Worker here. Next session starts from this file, not from another rebuild.

For a narrative account of how the site got to its current state, read [docs/handoff-2026-09-18.md](../docs/handoff-2026-09-18.md) and [docs/architecture.md](../docs/architecture.md) -- this file is the decision log (what's locked, what's rejected, what's still open), those two are the "what actually exists right now" reference. This file is more current than either: it carries changes made after the 18 September handoff doc was written (see "Homepage/run-ads merge" below), which is exactly why this file, not that one, wins on conflict.

**No `" -- "` or `—` in visible public-page copy** (17 September 2026, confirmed directly after it shipped and had to be swept out of six pages). Neither belongs in a sentence a visitor actually reads -- a real em dash reads as an AI-writing tell, a literal `" -- "` reads as a typo, arguably worse. Write two sentences, or use a comma/colon/semicolon instead. Full rule: [docs/aeo-strategy.md](../docs/aeo-strategy.md)'s Punctuation section. This is public-copy only -- this file, other docs, commit messages, and code comments are unaffected, `" -- "` there is normal and fine.

## FROZEN (13 September 2026, scope clarified 17 September 2026) — read this before touching anything

Daniel has spent repeated sessions rebuilding this homepage across different tools (Cursor, Cowork, Gemini) and wants that to stop. What's actually locked is the site's **visual identity**: background color (`--bg-color: #f0f9ff` in `css/styles.css`), font choice (the `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...` system stack — **do not change the font choice**), and base font sizes, site-wide, not just on the homepage. Do not re-theme, swap the font family, or change base type scale on your own initiative, no matter how it was reached ("this is more correct," "this reads better," matching a mockup someone pasted in). If a task seems to require changing colors, the font family, or base font sizes, stop and ask first.

Copy, CTAs, section content, and structure are **not** frozen — those get corrected/edited directly whenever they're wrong or stale (this is precedented repeatedly: hero CTAs, `#niches`, developers page, advertiser section, gambling policy, etc., 17 September 2026). Only the visual identity above requires asking first.

**Accessibility and indexability are standing requirements, not one-time tasks — check them on every change to `index.html` or `css/styles.css`:** the site must stay WCAG 2.1 AA compliant as well as reasonably achievable (contrast, semantic headings, alt text, focus states, skip link, labeled form fields), and it must stay crawlable/indexable by Google, Bing, and LLM crawlers (already in place: `robots.txt` allows GPTBot/ClaudeBot/PerplexityBot/Google-Extended, sitemap, JSON-LD — see `docs/aeo-strategy.md`). Neither is "done and forget" — re-verify after any homepage or stylesheet edit.

A separate branch/PR (`cursor/prefilled-demo-thread`, PR #12) rebuilt this homepage from a different tool's output and was **closed without merging** on 13 September 2026 for exactly this reason. Do not resurrect it, cherry-pick from it, or treat its existence as evidence the visual identity should change.

**Blog posts**, when added, follow the same pattern as the existing 15 posts and `docs/aeo-strategy.md`'s section rules (question-based H2s, 120-180 words per block, JSON-LD matching visible copy, no `—`/`" -- "` in body copy) — use them as the template rather than improvising a new format.

**Chatbot-developer/SDK copy belongs on `/developers/`, not the homepage** (confirmed directly, 17 September 2026: "the chatbot developers copy can be on the website, but not on the main page, and not the focus, I won't mind if app developers find my website"). It's fine for that content to exist and even to rank, just not on `index.html` and not as a homepage section, card, or the H1/title. This had regressed once already: as of 17 September the homepage's title, JSON-LD, H1, a highlights card, and a full "For engineers wiring a bot" section were still 100% the old "attach ads to independent AI chatbots via SDK" pitch, even after the MVP repositioning below was decided. Fixed that pass (homepage now leads with the site's own live chat + free ad testing; `/developers/` keeps the full SDK guide; a short audience-neutral floors table stayed on the homepage for transparency, without developer framing). Check `index.html`'s `<title>`, JSON-LD, and H1 specifically before calling any future copy sweep done.

(The "only new work permitted right now" list from 14 September — blog + legal pages — is superseded; the Stage 0-6 rebuild on 17 September added `run-ads/`, `admin/metrics/`, and the full chat/credit backend on top of that, all confirmed with Daniel. New-page and new-feature work still needs an explicit ask; what changed 17 September is that copy/structure edits to *existing* pages no longer require one — see above.)

**One foundation, no exceptions (14 September 2026):** every page on this site — the homepage, `demo/`, `ad-submission/`, `developers/`, `blog/`, `admin/`, and any future page — loads the same `css/styles.css` and reuses the same header/nav/footer HTML structure, fonts, and colors. A new page is new copy inside the existing template, never a new design. `blog/` follows this already: it loads `css/styles.css` plus a small *additive* `css/blog.css` for the few elements the homepage doesn't have (cover image, pull-quote), and nothing in `css/blog.css` overrides or duplicates a rule from `css/styles.css`. Any future add-on must work the same way. (`run-ads/` dropped from this list 18 September 2026 -- it's a redirect now, not a page, see "Homepage/run-ads merge" below.)

**Correction, 18 September 2026: "same header/nav/footer HTML structure" above was aspirational, not actually true, until today.** There is no shared partial or template anywhere in this repo -- every page hand-copies its own `<header>` and `<footer>` markup. An audit this session found the nav and footer had drifted per-page for a while: the top nav showed "Categories" on the homepage but "Ad submission" on every other page, "Demo" and "Ad submission" existed inconsistently across pages, and the footer link list differed page to page (some pages missing "Run ads" entirely, self-link omission handled three different ways). Fixed 18 September: same canonical nav and footer link list on every non-admin page now, see "Homepage/run-ads merge" below. It is still copy-pasted per page, not a real shared component -- if a future session wants a true single source of truth for the header/footer, that would need an actual build step or templating layer, which this static-Pages setup doesn't have.

New pages are additive — their own files. They do not touch `index.html`, `css/styles.css`, or `js/demo.js`'s existing content, beyond adding a nav/footer link to the new pages if asked (done for `blog/` in PR #15 — every page's nav and footer now links to it).

## Payment (built 14 September 2026, superseded by free submission +
advertiser-set budget, 17-18 September 2026)

**Submitting and testing a campaign are both free. `functions/api/
submit.js` has zero PayPal involvement.** PayPal only enters the picture
after approval, on the campaign's own page (`/campaign/:token`), to buy
prepaid click credit. The advertiser types their own dollar amount there
(no fixed packs), **$5.00 minimum**, confirmed directly by Daniel on 18
September 2026 -- see `functions/api/_lib/pricing.js`
(`MIN_CREDIT_PURCHASE_CENTS`, `MAX_CREDIT_PURCHASE_CENTS`) and
`docs/pricing.md` for the full current model. `PRICE_PER_CLICK_CENTS`
(currently $0.50) is still an explicit placeholder, unlike the $5.00
minimum, which is real.

PayPal Client ID and Secret are in Cloudflare Pages production
environment variables (Secret-type), account dan73ros@gmail.com,
currently in **Sandbox mode** (`PAYPAL_MODE` unset defaults to sandbox)
-- no real money moves yet. `functions/api/paypal/config.js` serves the
public Client ID, `functions/api/paypal/create-order.js` creates a
server-authoritative order for whatever amount the advertiser entered
(re-validated against the min/max, never trusted blindly), and
`functions/api/credit/purchase.js` calls `captureOrder`
(`functions/api/paypal/_shared.js`) to verify the actual PayPal capture
before crediting anything -- credit is never added on an unverified
payment. Captured payments land directly in Daniel's own PayPal account;
that capture *is* the revenue moment, the click-ledger afterward only
decides when to stop showing the card, not when Daniel gets paid.

**Not yet done:** switch `PAYPAL_MODE` to `live` when ready for real
money (one Cloudflare env var, no code change) -- do this only when
Daniel explicitly says to, and needs a separate live REST app created
directly in Daniel's PayPal dashboard first (sandbox credentials don't
work against the live API).

**Gap, confirmed 18 September 2026: the billing logic is verified, the
PayPal round-trip itself isn't.** The exact SQL `credit/purchase.js` and
`c/[id].js` run was tested directly against production D1 (purchase ->
balance -> click -> auto-deactivate, all correct, test rows cleaned up
after). What's still unclicked: an actual PayPal order create -> approve
-> capture, since that needs a human in a browser and this environment
can't reach either `prismpublication.com` or PayPal's API to drive it.
Confirmed acceptable to ship without that click-through for now -- do a
real one whenever convenient, before calling Stage 5 fully verified.

**House ads / owner inventory (added 18 September 2026).** Daniel wants
to run his own site (devorahsart.com, his daughter's art) as a
sponsored card without buying credit from himself -- "I am not going to
buy credits for my own daughter's art." Rather than a one-off manual D1
insert, built this as a real, repeatable admin action since he asked
"how can I easily add... going forward": `/admin/` now has a "Go live
free (house ad)" button on any `approved` submission that isn't already
live. It POSTs to `functions/api/submissions/[id]/house-credit.js`
(Access-gated, same pattern as the sibling `[id].js`), which inserts a
normal `credit_ledger` purchase row (default $50, admin can type a
different amount) with no PayPal capture behind it -- the ledger note
says so explicitly -- and sets `credit_active = 1`. From that point on
it behaves exactly like a real paying campaign: same matching, same
per-click draw-down in `functions/c/[id].js`, same automatic stop if
the balance ever runs out. `functions/api/submissions/index.js` (the
admin list) now also returns `credit_active` and `access_token` so the
UI can show which rows are live and conditionally render the button.
The normal flow for this: submit like any advertiser at
`/ad-submission/` (still free), approve it in `/admin/` as usual, then
click "Go live free" instead of the advertiser ever touching PayPal.

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

**Two related gaps, confirmed 18 September 2026, worth stating plainly
since nothing above says them directly:**
- **Approving a submission in `/admin/` doesn't touch `sdk/catalog.json`.**
  That file is a separate, hand-maintained catalog for third-party
  publishers, unused by the main D1-backed loop (submit -> screen ->
  approve -> buy credit -> go live). A real third-party integration would
  need `sdk/catalog.json` edited by hand, or a new endpoint matching
  against it instead of D1.
- **No non-JS publisher integration exists.** `sdk/prismClient.js` requires
  the publisher's own server to be Node/JS. A publisher on another
  language would have to call `functions/api/match.js` directly (the
  plain-HTTP endpoint above), there's no equivalent client library for
  them.

**`/run-ads/` (added 14 September 2026, rebuilt as a general chat 17
September 2026, merged into the homepage 18 September 2026 -- read the
correction below before trusting the rest of this paragraph):** ~~a second,
separate phone-UI page -- not the homepage demo, which stays exactly as
frozen above.~~ Two different things live behind this:
- `functions/api/match.js` -- advertiser self-test, unchanged by the merge.
  An advertiser types a question relevant to their own product and sees if
  their own approved card clears the floor. No account, ephemeral, nothing
  logged.
- `functions/api/chat.js` -- the general chat widget, as of 17 September
  2026 also unrestricted to any niche or topic (see "MVP repositioning"
  below). Answers via `functions/api/_lib/answer.js`, matches via the same
  `functions/api/_lib/matcher.js` cosine matcher `match.js` uses (both share
  it now, no duplicated logic). Open to any visitor, no account, no
  advertiser gate. As of 18 September this widget lives on the homepage
  itself, not a separate page, see below.

**Watch for this recurring mistake:** fitness/travel/health-and-wellness
example cards are fine to keep, but any sentence implying they're
special -- "the categories we see most," "most common," a claim about
volume or traffic by category -- is a leftover from the old
chatbot-developer-niche build and has no data behind it now (caught and
fixed twice on the same duplicated sentence, `index.html` and
`/ad-submission/`, 17 September 2026). When editing this section again,
grep the whole site for the phrase you're about to remove instead of
fixing the first instance you find -- it is very likely duplicated.

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
automated screening, free submission + prepaid credit go-live, metrics --
all shipped later the same day, see the dated sections below). Daniel
has also flagged that swapping the chat's answer model from Workers AI to
OpenAI is on the table if quality needs it -- `_lib/answer.js` is written
so that's an env-var change (`OPENAI_API_KEY`), not a rewrite.

**Chat grounding fix (18 September 2026):** Daniel tested the live chat on
his phone and found it confidently fabricating answers about the site
itself, worst case, "are my questions stored?" got a flat "no, not
stored," directly contradicting the "questions are stored anonymously"
text sitting right above the phone UI on the same page. Also: claimed to
be "a custom model... fine-tuning unique to this application" (false, it's
an off-the-shelf Workers AI/OpenAI model with a system prompt only),
invented a subscription/premium-content business model (real one is free
submission + free testing + prepaid click billing), and flatly denied ads
exist at all when asked directly. Root cause: the system prompt made it
general-purpose with no grounding in the site's own facts, so on
meta-questions about the site it confabulated a plausible SaaS-company
answer instead of deferring. Fixed in `_lib/answer.js`'s `SYSTEM_PROMPT`:
added a short numbered ground-truth block (data IS stored for matching,
it's an off-the-shelf model not custom-trained, real business model, ads
can truthfully be confirmed to exist though never recommended by name)
and an instruction to say "not sure" rather than guess beyond it. Added a
fifth fact the same day, at Daniel's explicit wording: who built this
site (Daniel Rosenthal, solo, AI-assisted tools, Cloudflare hosting),
gated to only answer if asked directly, never volunteered, since he
doesn't want the build process advertised but also doesn't want the
chat inventing a fake origin story if someone does ask. If the
chat's answers about itself ever drift from what's actually true on the
site again, this is the file to check first, and the fix is updating this
fact block, not just the tone/length instructions around it.

**Content boundary added 18 September 2026.** Daniel flagged that "Ask
anything" (the site's own framing, in the H1, chat header, and meta
description on `/run-ads/`, plus similar "ask it anything"/"the same way
you would ChatGPT" phrasing on the homepage) was too open an invitation,
and that this UI phone isn't a real ChatGPT-equivalent product with
ChatGPT's own safety layer behind it, it's a small off-the-shelf model
(Workers AI Llama or OpenAI gpt-4o-mini) under a thin system prompt that,
before this, literally said "answer whatever the visitor asks, on any
topic" with zero content guardrail beyond medical/legal/financial advice.
Two fixes: (1) swept "ask anything" style copy off `/run-ads/` and
`index.html` (H1, meta description, chat header, subheads, FAQ JSON-LD),
replaced with "ask a real question" / "general questions"; (2) added an
explicit rule to `_lib/answer.js`'s `SYSTEM_PROMPT`: never produce sexual
or explicit content, anything sexualizing minors, violence/weapons/illegal
instructions, or anything else inappropriate for a general-audience site
with no age gate, decline in one sentence and move on if asked. If the
copy ever drifts back toward "ask anything" framing, re-check this rule
is still in the system prompt too, they were fixed together on purpose.

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
logged before redirecting to `destination_url`. Built ahead of the
credit/pay-per-click pricing model that shipped later the same week
(Stage 5), because retrofitting click tracking after ads start running is
worse than having it from the start.

**Click-fraud guard added 18 September 2026**, after Daniel asked how
this gets prevented, since it's a known PPC-era problem and the route
above originally had zero protection: any GET to `/c/:id` billed a click,
no check at all. Now a click only bills the advertiser's credit if (1)
this exact session actually got this exact ad served by `/api/chat`
first (`chat_events` has a matching `kind='chat'` row for that
session_id + matched_ad_id -- blocks a cold curl/scraper/guessed-id hit
with no real chat turn behind it), and (2) this session hasn't already
billed a click on this same ad (`chat_events kind='click'` lookup --
blocks refresh/double-tap/back-button repeat billing). Neither check
blocks the redirect itself, a non-billable hit still sends the visitor
to `destination_url`, it just writes nothing to `chat_events` or
`credit_ledger`. This does not stop a determined attacker scripting
fresh sessionIds through real `/api/chat` turns in a loop, but
`chat.js`'s own per-IP rate limits (`PER_IP_10_MIN_LIMIT`,
`PER_IP_DAILY_LIMIT`) already cap how many of those one IP can generate
per day. If click volume ever looks suspicious, `chat_events` has
`ip_hash` per click so a burst can be traced, but there's no automated
alerting on this yet, it's a manual admin-review gap.

**Correction, 17 September 2026: this Pages project runs Build System v3,
which reads bindings from `wrangler.toml` in the repo, not the dashboard.**
Confirmed directly -- Settings -> Bindings -> Add now shows "managed by
Wrangler" and refuses manual additions; the existing `DB` binding just
predates that lockdown. So the `[ai]` binding added to `wrangler.toml` for
Stage 2 applies automatically on deploy: to preview builds of whichever
branch has it, to production once that branch reaches `main`. Don't send
anyone to the dashboard to add a binding by hand again -- add it to
`wrangler.toml` and let it deploy. Secrets are the exception: those still
go in the dashboard, but under **Variables and secrets**, a different
section from Bindings. `IP_HASH_SALT` (any random string) needs setting
there for real rate-limit security (works without it, just with a
guessable fallback salt -- see `functions/api/_lib/hash.js`); optional
`OPENAI_API_KEY` switches `/api/chat`'s answers to OpenAI instead of
Workers AI. Without the `AI` binding live and no `OPENAI_API_KEY` set,
`/api/chat` still matches ads correctly but returns a "not configured yet"
placeholder instead of a real answer -- check which is true before calling
the chat "live."

**Stage 3, built 17 September 2026: the ad-from-URL builder, on `/run-ads`
above the chat.** Paste a product URL -> `functions/api/draft-ad.js`
fetches it (`_lib/urlFetch.js`: https only, blocks localhost/private IPs,
12s timeout, 6MB cap -- raised from an original 5s/1MB after real Amazon/
Shein URLs kept failing on completely normal pages, HTMLRewriter pulls
just `<title>`, meta description, first `<h1>` -- nothing else is read) ->
the shared model helper
(`_lib/model.js`, same OpenAI-or-Workers-AI choice as chat) drafts brand/
title/description/CTA/category as JSON -> returned to the browser as a
suggestion only, nothing saved yet. The visitor edits it in the form, then
"Test in the chat below" calls `functions/api/test-ad.js`, which saves the
(possibly edited) fields as that session's one active test ad in the new
`test_ads` D1 table (one per session -- saving again replaces the last
one). `/api/chat` scores that test ad alongside the public approved pool
on every message (`_lib/matcher.js`'s `findBestAd` now takes an
`extraRows` array for exactly this) and always reports `testAdScore`
separately, even on messages where a different ad's card actually shows or
no card shows at all -- so the person testing sees their own number every
time, not just when they "win." A test ad is never returned to, or
scored for, any other session. "Submit this ad for review" prefills
`/ad-submission/`'s form via query params (`?brand=...&title=...` etc. --
see the `prefillFromQuery` block near the top of that page's script) so
the loop is draft -> edit -> test free -> submit (free) -> screening ->
buy credit -> go live (Stages 4-5, built the same week, see below).

**Bug fixed 18 September 2026:** Daniel pasted a real product URL
(devorahsart.com) into the ad-from-URL builder and got a generic
"Could not reach the ad builder" with no real reason -- that exact
message only appears client-side when the server's response isn't
valid JSON at all, not from any of `draft-ad.js`'s own error returns
(those were all already handled and always returned proper JSON). Found
two real gaps by checking `chat_events` directly (a `kind='draft'` row
existed at the right timestamp, proving the request reached the server
and passed the rate-limit check, so it broke somewhere after that,
unlogged): (1) the D1 rate-limit check itself had no try/catch at
all, unlike every other step in the file -- a hiccup there crashed the
whole function into Cloudflare's generic non-JSON error page; (2) if
the AI ever returned valid-but-unexpected JSON (a bare `null`, a
string, an array), `draft.brand` right after would throw uncaught, same
symptom. Both are now guarded, every path returns real JSON. Couldn't
fully confirm from this environment (no live log access, and the
sandbox can't reach either prismpublication.com or the reported
product URL to reproduce it directly) whether this was the exact cause
here or a platform-level timeout on a slow page load stacked on top of
the AI drafting step.

**Confirmed it wasn't that (still 18 September 2026):** Daniel retried
immediately, still got the same generic message. Checked `chat_events`
again -- two fresh `kind='draft'` rows, ~13 seconds apart, both AFTER
the fix above shipped. That proves the D1 step was never actually the
crash site (it wrote successfully every single time, before and after),
so the real failure is downstream, in the page-fetch or AI step, in a
way that bypasses even THEIR OWN try/catch blocks. The only thing that
can do that is a hard platform-level kill. Found the real gap: the page
fetch (`_lib/urlFetch.js`) has a 12s timeout, but `_lib/model.js`'s
`complete()` (the AI drafting call) had **no timeout at all**, on
either the OpenAI path or the Workers AI path. If that call hangs, even
briefly, Cloudflare kills the whole request outside any try/catch in
this codebase, producing exactly this symptom, a non-JSON response the
browser can't parse. Fixed: added a 15s (`AI_TIMEOUT_MS`) bound to
both paths in `_lib/model.js` -- an `AbortController` on the OpenAI
fetch (same pattern as `urlFetch.js`), and a `Promise.race` against a
timer for `env.AI.run()`, which takes no abort signal of its own, so
racing it is the only way to make OUR code give up on time even though
the orphaned call keeps running in the background. This is a real,
general fix for any caller of `complete()` (chat.js's answers too, not
just draft-ad.js), not a draft-ad-specific patch.

If this still fails after shipping, the error message returned should
now be one of `complete()`'s own clean strings ("OpenAI took too long to
respond," "Workers AI took too long to respond," etc.) instead of the
generic client-side catch-all -- if it's STILL the generic message even
after this, that would point at something even further upstream (Pages
Functions routing itself, or an account-level plan/CPU limit), which
would need Cloudflare dashboard log access (Workers Logs / real-time
logs) to diagnose further, not guessable from this repo alone.

Older, still true: not built are the `prism-jobs`-style scheduled
cleanup Worker the original plan called for --
expired `test_ads` rows are deleted lazily instead (on the next
`/api/draft-ad` or `/api/test-ad` call), which is enough at this traffic
level and needed no new Worker.

## Homepage/run-ads merge + nav-footer standardization (18 September 2026)

Two problems, fixed in one pass in the same session, after repeated
rebuilds across different tools (Cursor, Cowork, this one) kept
re-touching the header/nav/footer and the homepage without seeing each
other's changes. Daniel does not want an eighth rebuild cycle; if you're
about to touch the header, footer, or homepage hero/chat, read this whole
section first, not just the nearest paragraph.

**1. Nav and footer were quietly inconsistent across pages** (see the
correction under "One foundation" above for the audit findings). Fixed:
every non-admin page now has the same top nav, in this order: **Chat**
(`/`), **Run ads** (`/#chat`), **Developers** (`/developers/`), **Blog**
(page-relative: `/blog/` on top-level pages, `./` on `blog/index.html`,
`../` on blog posts), **Contact** (`mailto:` link). "Demo" and "Ad
submission" were removed from the top nav entirely -- both pages still
exist and are still reachable from the footer, nothing 404s. `aria-current="page"`
is set on whichever item matches the current route (nothing on `/demo/`,
`/ad-submission/`, `/privacy/`, `/terms/`, since none of them have a
matching nav item). The footer link list is now the same 9 items on
every non-admin page too: Home, Run ads, Demo, Ad submission,
Developers, Blog (page-relative, same rule as nav), Contact, Privacy,
Terms -- no more self-link omitted on some pages and not others.
`admin/index.html` and `admin/metrics/index.html` keep their own
separate, minimal nav, untouched. Still no shared partial or template
anywhere -- this is 21+ pages of consistent hand-copied markup, not a
single source of truth. A future change to the nav or footer still means
editing every page.

**2. The homepage's own demo was dead, the real product was hidden at
`/run-ads/`.** The homepage led with a scripted, non-interactive phone
replay (composer disabled, Play/Reset only); the actual live chat only
existed at `/run-ads/`. Anyone landing on the bare domain saw a fake demo
instead of the product. Fixed: the live chat is now the first thing on
`index.html`.
- `index.html`'s hero is now `/run-ads/`'s old hero copy (open-to-everyone
  eyebrow, "ask a real question" H1, "live chat, not a script" subhead).
  The old hero's highlights grid and byline/dates paragraph are gone, not
  preserved elsewhere -- if that content is missed, it needs a deliberate
  decision to bring back, it wasn't kept by accident.
- The live chat (`section.demo-board`, now also `id="chat"` so nav and
  other pages can link straight to it) and the ad-from-URL draft tool
  (`section.advertisers#build-ad`) moved from `run-ads/index.html` into
  `index.html`, directly after the hero. Every id and data attribute is
  unchanged, so `/api/chat`, `/api/track`, `/api/reach`, and
  `/api/draft-ad` all work exactly as before, just from the homepage now.
  The inline chat/draft script moved with them and exists in exactly one
  file.
- The old scripted sandbox (`section.sandbox-section#sandbox`, disabled
  composer, `js/demo.js`-driven Play/Reset) is deleted from `index.html`
  entirely. `js/demo.js` itself is untouched and still loaded by
  `demo/index.html`, which keeps its own separate scripted walkthrough --
  don't delete that file, only `index.html`'s reference to it was removed.
  `section.advertisers#advertisers`, `section.niches#niches`, and
  `section.aeo#floors` kept their existing content and relative order.
- `run-ads/index.html` no longer exists. `_redirects` gained two lines,
  `/run-ads` and `/run-ads/` both 301 to `/`, so old links, bookmarks, and
  the sitemap entry (not yet updated, still lists `/run-ads/`, harmless
  since it now redirects) don't 404. Body-copy links to `/run-ads/` on
  `privacy/`, `terms/`, `ad-submission/`, `developers/`, and the footer
  were deliberately left as literal `/run-ads/` rather than rewritten,
  since they still resolve correctly through the redirect and weren't
  asked to change.

**Known gaps, current as of 18 September 2026** (the fuller version of
some of these lives inline above, this is the flat list):
1. PayPal round-trip (order create -> approve -> capture) still unclicked, billing logic verified against D1 directly instead, confirmed acceptable to ship without it for now.
2. `PRICE_PER_CLICK_CENTS` still a placeholder ($0.50); `MIN_CREDIT_PURCHASE_CENTS` ($5.00) is real.
3. `sdk/catalog.json` not wired to approvals.
4. No non-JS publisher integration.
5. `docs/ad-submission.md` still stale; `docs/pricing.md` is current as of today.
6. PayPal still in sandbox mode, needs a live REST app from Daniel plus `PAYPAL_MODE=live`.
7. `devorahsart-notify` Worker still orphaned (separate repo/resource), no decision made.
8. No automated alerting on click-volume anomalies.

## Locked public site

- Origin: https://prismpublication.com/
- Host: Cloudflare Pages on GitHub `main`. Build `echo "Building static site"`. Never `wrangler pages deploy` or `wrangler deploy` -- Git push is the only deploy path. `wrangler pages dev` locally is fine (it's not a deploy).
- Pages: `index.html` (now the general live chat + advertiser ad-testing itself, see "Homepage/run-ads merge" below), `demo/index.html` (still the scripted Play/Reset walkthrough, untouched), `developers/index.html`, `ad-submission/index.html`, `blog/` (index + 15 posts), `admin/index.html` (Access-protected), `privacy/index.html`, `terms/index.html`, `css/styles.css`. `run-ads/index.html` no longer exists as a file -- `/run-ads` and `/run-ads/` 301-redirect to `/` via `_redirects`.
- **Corrected 18 September 2026, was wrong above:** the homepage's visitor experience is now the **live chat** (real composer, posts to `/api/chat`, `/api/track`, `/api/reach`), not the scripted phone thread. The scripted Play/Reset thread with the disabled composer was deleted from the homepage entirely and only still exists on `/demo/`. Do not "fix" the homepage back to a disabled scripted demo, that would be undoing 18 September's actual, requested change.
- One page paint only: `#f0f9ff` on html, body, header, main, footer, sections, containers, cards, tables. No `--section` / `--card-bg` second wash. Buttons may use accent. Phone chrome and in-thread cards stay device UI, not page paint.
- Alignment: paragraphs and long copy **left**. Headlines (h1/h2) and CTA groups **center**. No justify. No right-aligned body.
- Measure: body lines about **75ch**. Body type **1.125rem** (never under 16px), `#1e293b` on `#f0f9ff`.
- Contrast: normal text ≥ 4.5:1, large text ≥ 3:1. Links `#075985`, muted/headings `#0c4a6e`.
- Hierarchy: h1 800, h2 700, labels 700, CTAs 700 and ≥44px tall, body 400. Underlined in-copy links. That order is how attention should move.
- Phone stays a centered object; bubbles inside it stay left.

**Stage 4, built 17 September 2026: light-touch automated screening on
submission.** No separate "go live" step exists yet, so `functions/api/
submit.js` is the actual gate now, not a future one. Screening
(`functions/api/_lib/screening.js`) runs before PayPal payment is
captured -- an outright rejection is never charged, the PayPal order is
just left uncaptured and expires on its own. Deliberately light-touch,
per Daniel: only the genuinely non-negotiable prohibited-category list
(weapons, explosives, political campaigning, impersonation, etc., in
that priority order -- same list as the "What will you not run?" prose
on `/ad-submission/`) blocks a submission outright. Gambling is not on
this list -- it never blocks, it always routes to `needs_review` (see
Payment/Stage 4 notes above). Everything else -- health claims, misleading
claims, low model confidence -- routes to `needs_review` instead of
blocking anyone; a `needs_review` submission is still charged and still
stored, just flagged for Daniel to check in `/admin/` before approving.
No rule-based checks (price text, ALL CAPS, link shorteners) -- tried
those first, cut them because an automated false positive blocking a
real advertiser was exactly the wrong kind of friction for this MVP.
No email-notification step from the original plan (a signed one-tap
approve/reject link) -- that would need a third-party email service,
which this repo's own rule above says not to add without asking; the
existing `/admin/` review queue already covers `needs_review` without one.

`ad_submissions.status` is now actually set on insert (`auto_cleared` or
`needs_review`) instead of always defaulting to `pending` -- `review_notes`
is populated with the screening model's one-sentence reason too.

**Stage 5, built 17 September 2026: free submission, prepaid click credit
to go live.** The $5-at-submission fee is retired -- confirmed directly
with Daniel this should be a real removal, not additive. Submitting and
testing (both `/api/match` and the `/run-ads` chat) are free with no
payment step anywhere in that path. The only charge now: once Daniel
approves a submission in `/admin/`, the advertiser buys prepaid click
credit to actually go live.

No account system exists, so `functions/api/submit.js` generates a random
`access_token` on insert and returns it -- that's the advertiser's only
way back. `functions/campaign/[token].js` (GET `/campaign/:token`) is
their one page: shows current status, and once approved, credit-pack
PayPal buttons to go live. Credit balance is never a stored running total
-- always `SUM(amount_cents)` over the new `credit_ledger` table (purchase
rows positive, click rows negative), so it can't drift from the actual
history. `ad_submissions.credit_active` is the fast-path flag the matcher
actually reads (`_lib/matcher.js`'s `findBestAd` now takes a
`requireActive` option, default true) -- set to 1 on a credit purchase,
flipped back to 0 in `functions/c/[id].js` the moment a click would drop
the balance below one more click's cost. `functions/api/match.js` (the
advertiser's own self-test) explicitly passes `requireActive: false`,
since testing your own already-approved ad is a content-match question,
not a billing-state one -- it should work before credit is ever bought.

Pricing lives in one place, `functions/api/_lib/pricing.js`
(`CREDIT_PACKS_CENTS`, `PRICE_PER_CLICK_CENTS`) -- **both are explicitly
placeholder values**, not numbers Daniel has actually set. Change them
there; nothing else needs touching, every page/endpoint that quotes a
price reads from this file.

`functions/api/paypal/_shared.js`'s `createOrder`/`captureOrder` were
generalized to take/return a plain amount instead of the old hardcoded
$5 -- the caller (`credit/purchase.js`) checks the captured amount
against `CREDIT_PACKS_CENTS` itself now.

Site copy updated everywhere the $5 fee was mentioned: `ad-submission/
index.html`, `terms/index.html`, `privacy/index.html`, `run-ads/
index.html` (now merged into `index.html`, see below). **Not updated**:
`docs/pricing.md` and `docs/ad-submission.md` (the stale operator docs
already flagged in earlier sessions as describing an older
third-party-SDK sales motion) were further out of sync -- still worth a
real rewrite pass, not attempted here. **Update, 18 September 2026:
`docs/pricing.md` was rewritten and is current now. `docs/ad-submission.md`
is still the stale one**, still describing the old niche/fee model, still
needs the same treatment `pricing.md` already got.

**Not built, deliberately out of scope for this pass:** PayPal webhook
handling (reused the existing direct-capture-and-verify pattern instead,
consistent with how the old $5 flow worked); a refund *request* UI on the
campaign page (added a plain "email us" line instead -- refunds are still
manual, handled by Daniel); showing credit balance/active state in
`/admin/` (nice-to-have, not required for the loop to work).

**Stage 6, built 17 September 2026: funnel/revenue dashboard, no new
infra.** Deliberately leaner than the original plan -- no `daily_stats`
rollup table, no `prism-jobs` scheduled Worker. Everything's computed
live at request time from tables that already exist for other reasons
(`chat_events`, `test_ads`, `ad_submissions`, `credit_ledger`); traffic
is nowhere near the volume where that would be slow. No per-niche
breakdown either, consistent with niches being "nearly irrelevant" now.

- `functions/api/track.js` -- the *only* new event-logging endpoint,
  and it logs exactly one kind (`page_view`), since every other funnel
  step already has a natural place it happens server-side (a chat turn,
  a click, a `test_ads` insert, an `ad_submissions` insert, a
  `credit_ledger` purchase row) and didn't need duplicate tracking.
- `functions/api/metrics.js` -- GET, Access-gated (same header-check
  pattern as `/api/submissions`), 7-day and 30-day windows: page views,
  chats started, chat turns, match rate, test ads created, submissions,
  approvals, credit purchases, clicks, revenue.
- `admin/metrics/index.html` -- the dashboard itself, same
  self-contained fetch-and-render pattern as `admin/index.html`.
- `functions/api/reach.js` -- the one number safe to show publicly (not
  the whole funnel): questions asked in the last 7 days, on `/run-ads`'s
  hero. Below 20/week it shows "early stage, low volume" instead of the
  real number, so a near-zero count early on doesn't undermine trust.
- `privacy/index.html` updated for the new `page_view` logging -- same
  pattern as the chat-logging disclosure added for Stage 2 (hashed IP,
  random session id, no identity link).

**One dashboard step Daniel still needs to do:** add a Cloudflare Access
path rule for `/api/metrics` (Zero Trust -> Access -> Applications --
same application or a new path rule alongside the existing
`/api/submissions*` one, same email-only policy). `/api/track` and
`/api/reach` are deliberately public -- don't gate those, every visitor's
browser calls them.

## Idea, not yet actioned: affiliate marketers as an ICP (18 September 2026)

Daniel's note for a future session (flagged "next Saturday night," not
done now): consider **affiliate marketers/affiliate programs themselves**
as an ICP who could use the site's own phone-UI live chat to run and test
their affiliate ad copy -- not just seeding devorahsart/israelileads/the
4 recovered affiliate ads (Searchable, AirOps, Shipper.now, Amazon) as
inventory *in* the matcher (already done, 18 September, see `ad_library`
above), but pitching the chat itself as a testing/distribution channel
*to* affiliate marketers as customers, the same way the ad-builder already
pitches to any advertiser.

Context for why this came up: a pasted document (unclear origin, styled as
an "AI Collaborator" writeup, not verified against any primary source)
argues affiliate marketing is shifting from SEO-click-arbitrage toward
"AI citation"/GEO and closed-loop channels because ~68% of Google searches
now end without a click. **That 68% figure and the other stats in that
document are unsourced and have not been independently verified here --
do not repeat them publicly (on the site, in a blog post, in outbound
copy) without checking a primary source first**, consistent with this
repo's standing rule to cite real numbers (see the CPM/CPC pricing
sections in the blog for the pattern to follow: real source, real link).
The strategic idea itself (affiliates need new places to prove ad copy
works, now that organic SEO traffic is eroding) doesn't depend on that
specific stat being right, and is worth thinking through on its own
merits.

Nothing built yet. No new page, no copy change, no outreach. Whoever
picks this up next should scope it as a real decision (is this a new
homepage section, a dedicated landing page, a line in `/developers/`,
or outbound-only messaging with no site change at all) before writing
anything.

**Queued deliverable: a blog post, "Affiliate marketing in the
contextualized ad era."** Blocked on the sourced deep-dive into the real
state of the affiliate industry Daniel said is coming -- do not draft
this post from the unsourced document above. When the sourced research
lands, write it the same way the existing blog posts handle numbers
(real source, real link, no bare stat -- see `blog/what-ai-chat-ads-
actually-are/index.html`'s CPM/CPC section as the template) and follow
the same house-style rules as every other post: question-based H2s,
120-180 words per block, JSON-LD matching visible copy, no `--`/em dash
in body copy (see `docs/aeo-strategy.md`). Likely angle, not yet
confirmed with Daniel: affiliates losing organic/zero-click traffic need
a place to prove ad copy still converts -- ties directly into the ICP
idea above, but the blog post and the ICP/product decision are two
separate deliverables, don't block one on the other.

## Rejected (do not restore)

- Homepage matcher form (`#sandbox-form`, category select, Fitness/Sleep fill buttons)
- `js/sandbox.js` as the visitor experience (homepage loads `js/demo.js`)
- All-center or all-left lock on every section
- White slab cards that stripe the page
- `scripts/build-static.js`, `components/editor.js` leftover kit
- Worker / Supabase / Vercel / Prism-hosted key

## Unlock

Change public HTML or CSS only when Daniel says to. Then one commit to `main`, one Pages deploy. No palette passes.
