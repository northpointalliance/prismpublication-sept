# Carry-forward | prismpublication-sept

This repo is the live static site. It is not the hub. There is no `apps/memory` Worker here. Next session starts from this file, not from another rebuild.

For a narrative account of how the site got to its current state, read [docs/handoff-2026-09-17.md](../docs/handoff-2026-09-17.md) and [docs/architecture.md](../docs/architecture.md) -- this file is the decision log (what's locked, what's rejected, what's still open), those two are the "what actually exists right now" reference.

**No `" -- "` or `—` in visible public-page copy** (17 September 2026, confirmed directly after it shipped and had to be swept out of six pages). Neither belongs in a sentence a visitor actually reads -- a real em dash reads as an AI-writing tell, a literal `" -- "` reads as a typo, arguably worse. Write two sentences, or use a comma/colon/semicolon instead. Full rule: [docs/aeo-strategy.md](../docs/aeo-strategy.md)'s Punctuation section. This is public-copy only -- this file, other docs, commit messages, and code comments are unaffected, `" -- "` there is normal and fine.

## FROZEN (13 September 2026, scope clarified 17 September 2026) — read this before touching anything

Daniel has spent repeated sessions rebuilding this homepage across different tools (Cursor, Cowork, Gemini) and wants that to stop. What's actually locked is the site's **visual identity**: background color (`--bg-color: #f0f9ff` in `css/styles.css`), font choice (the `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...` system stack — **do not change the font choice**), and base font sizes, site-wide, not just on the homepage. Do not re-theme, swap the font family, or change base type scale on your own initiative, no matter how it was reached ("this is more correct," "this reads better," matching a mockup someone pasted in). If a task seems to require changing colors, the font family, or base font sizes, stop and ask first.

Copy, CTAs, section content, and structure are **not** frozen — those get corrected/edited directly whenever they're wrong or stale (this is precedented repeatedly: hero CTAs, `#niches`, developers page, advertiser section, gambling policy, etc., 17 September 2026). Only the visual identity above requires asking first.

**Accessibility and indexability are standing requirements, not one-time tasks — check them on every change to `index.html` or `css/styles.css`:** the site must stay WCAG 2.1 AA compliant as well as reasonably achievable (contrast, semantic headings, alt text, focus states, skip link, labeled form fields), and it must stay crawlable/indexable by Google, Bing, and LLM crawlers (already in place: `robots.txt` allows GPTBot/ClaudeBot/PerplexityBot/Google-Extended, sitemap, JSON-LD — see `docs/aeo-strategy.md`). Neither is "done and forget" — re-verify after any homepage or stylesheet edit.

A separate branch/PR (`cursor/prefilled-demo-thread`, PR #12) rebuilt this homepage from a different tool's output and was **closed without merging** on 13 September 2026 for exactly this reason. Do not resurrect it, cherry-pick from it, or treat its existence as evidence the visual identity should change.

**Blog posts**, when added, follow the same pattern as the existing 15 posts and `docs/aeo-strategy.md`'s section rules (question-based H2s, 120-180 words per block, JSON-LD matching visible copy, no `—`/`" -- "` in body copy) — use them as the template rather than improvising a new format.

**Chatbot-developer/SDK copy belongs on `/developers/`, not the homepage** (confirmed directly, 17 September 2026: "the chatbot developers copy can be on the website, but not on the main page, and not the focus, I won't mind if app developers find my website"). It's fine for that content to exist and even to rank, just not on `index.html` and not as a homepage section, card, or the H1/title. This had regressed once already: as of 17 September the homepage's title, JSON-LD, H1, a highlights card, and a full "For engineers wiring a bot" section were still 100% the old "attach ads to independent AI chatbots via SDK" pitch, even after the MVP repositioning below was decided. Fixed that pass (homepage now leads with the site's own live chat + free ad testing; `/developers/` keeps the full SDK guide; a short audience-neutral floors table stayed on the homepage for transparency, without developer framing). Check `index.html`'s `<title>`, JSON-LD, and H1 specifically before calling any future copy sweep done.

(The "only new work permitted right now" list from 14 September — blog + legal pages — is superseded; the Stage 0-6 rebuild on 17 September added `run-ads/`, `admin/metrics/`, and the full chat/credit backend on top of that, all confirmed with Daniel. New-page and new-feature work still needs an explicit ask; what changed 17 September is that copy/structure edits to *existing* pages no longer require one — see above.)

**One foundation, no exceptions (14 September 2026):** every page on this site — the homepage, `demo/`, `run-ads/`, `ad-submission/`, `developers/`, `blog/`, `admin/`, and any future page — loads the same `css/styles.css` and reuses the same header/nav/footer HTML structure, fonts, and colors. A new page is new copy inside the existing template, never a new design. `blog/` follows this already: it loads `css/styles.css` plus a small *additive* `css/blog.css` for the few elements the homepage doesn't have (cover image, pull-quote), and nothing in `css/blog.css` overrides or duplicates a rule from `css/styles.css`. Any future add-on must work the same way.

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
5s timeout, 1MB cap, HTMLRewriter pulls just `<title>`, meta description,
first `<h1>` -- nothing else is read) -> the shared model helper
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
scored for, any other session. "Submit this ad for review ($5)" prefills
`/ad-submission/`'s form via query params (`?brand=...&title=...` etc. --
see the `prefillFromQuery` block near the top of that page's script) so
the loop is draft -> edit -> test free -> submit -> pay -> (later stages)
go live.

Not built: automated brand-safety screening before submission (still
fully manual review in `/admin/`, same as before this stage), and the
`prism-jobs`-style scheduled cleanup Worker the original plan called for --
expired `test_ads` rows are deleted lazily instead (on the next
`/api/draft-ad` or `/api/test-ad` call), which is enough at this traffic
level and needed no new Worker.

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
index.html`. **Not updated**: `docs/pricing.md` and `docs/ad-submission.md`
(the stale operator docs already flagged in earlier sessions as
describing an older third-party-SDK sales motion) are now even further
out of sync -- still worth a real rewrite pass, not attempted here.

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

## Rejected (do not restore)

- Homepage matcher form (`#sandbox-form`, category select, Fitness/Sleep fill buttons)
- `js/sandbox.js` as the visitor experience (homepage loads `js/demo.js`)
- All-center or all-left lock on every section
- White slab cards that stripe the page
- `scripts/build-static.js`, `components/editor.js` leftover kit
- Worker / Supabase / Vercel / Prism-hosted key

## Unlock

Change public HTML or CSS only when Daniel says to. Then one commit to `main`, one Pages deploy. No palette passes.
