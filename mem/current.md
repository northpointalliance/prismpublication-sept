# Carry-forward | prismpublication-sept

This repo is the live static site. It is not the hub. There is no `apps/memory` Worker here. Next session starts from this file, not from another rebuild.

## FROZEN (13 September 2026) — read this before touching anything

Daniel has spent repeated sessions rebuilding this homepage across different tools (Cursor, Cowork, Gemini) and wants that to stop. **The homepage exactly as it exists on `main` right now — this `index.html`, `css/styles.css`, `js/demo.js`, nav, copy, colors, and the phone demo — is the permanent baseline.** Do not redesign it, restructure it, re-theme it, or rewrite its copy on your own initiative, no matter how it was reached ("this is more correct," "this reads better," matching a mockup someone pasted in). If a task seems to require changing the homepage's look, structure, or copy, stop and ask first.

A separate branch/PR (`cursor/prefilled-demo-thread`, PR #12) rebuilt this homepage from a different tool's output and was **closed without merging** on 13 September 2026 for exactly this reason. Do not resurrect it, cherry-pick from it, or treat its existence as evidence the homepage should change.

**The only new work permitted right now:**
- A blog (shipped 14 September 2026 — `blog/`, 15 posts + index)
- Legal pages: Terms & Conditions, Privacy

**One foundation, no exceptions (14 September 2026):** every page on this site — the frozen homepage, `demo/`, `ad-submission/`, `developers/`, `blog/`, and any future page — loads the same `css/styles.css` and reuses the same header/nav/footer HTML structure, fonts, and colors. A new page is new copy inside the existing template, never a new design. `blog/` follows this already: it loads `css/styles.css` plus a small *additive* `css/blog.css` for the few elements the homepage doesn't have (cover image, pull-quote), and nothing in `css/blog.css` overrides or duplicates a rule from `css/styles.css`. Any future add-on (legal pages included) must work the same way.

New pages are additive — their own files. They do not touch `index.html`, `css/styles.css`, or `js/demo.js`'s existing content, beyond adding a nav/footer link to the new pages if asked (done for `blog/` in PR #15 — every page's nav and footer now links to it).

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

Still not built: a plain HTTP matching endpoint for third-party publishers
on non-JS backends. See "Known gap" in docs/ad-submission-backend.md.

## Locked public site

- Origin: https://prismpublication.com/
- Host: Cloudflare Pages on GitHub `main`. Build `echo "Building static site"`. Never `wrangler pages deploy` or `wrangler deploy` -- Git push is the only deploy path. `wrangler pages dev` locally is fine (it's not a deploy).
- Pages: `index.html`, `demo/index.html`, `developers/index.html`, `ad-submission/index.html`, `blog/` (index + 15 posts), `admin/index.html` (Access-protected), `css/styles.css`.
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
