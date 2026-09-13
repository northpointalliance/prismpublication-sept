# Carry-forward | prismpublication-sept

This repo is the live static site. It is not the hub. There is no `apps/memory` Worker here. Next session starts from this file, not from another rebuild.

## FROZEN (13 September 2026) — read this before touching anything

Daniel has spent repeated sessions rebuilding this homepage across different tools (Cursor, Cowork, Gemini) and wants that to stop. **The homepage — `index.html`, `css/styles.css`, `js/demo.js`, and the phone demo UX/colors/layout as they exist after [PR #12](https://github.com/northpointalliance/prismpublication-sept/pull/12) — is the baseline.** Do not redesign it, restructure it, re-theme it, or "improve" its copy or layout on your own initiative.

**The only new work permitted right now:**
- A blog (new pages/section)
- Legal pages: Terms & Conditions, Privacy

Both are additive. They get their own pages/files. They do not change `index.html`, `css/styles.css`, `js/demo.js`, or the nav/colors/hierarchy already in place, beyond adding a nav link to the new pages if asked.

**Known, accepted drift — do not "fix" these as a side effect of other work; only touch them if Daniel explicitly asks:**
- `index.html` has no JSON-LD in `<head>` and no SDK Q&A section (`docs/aeo-strategy.md` calls for both, but adding them means editing the homepage, which is frozen).
- Two paragraphs in the "Start a test" form are center-aligned, not left, per the alignment rule below.

If a task seems to require changing the homepage's look, structure, or copy, stop and ask first — do not treat "it'll look better" or "this is more correct" as authorization.

## Locked public site

- Origin: https://prismpublication.com/
- Host: Cloudflare Pages on GitHub `main`. Build `echo "Building static site"`. Never Wrangler deploy.
- Pages: `index.html`, `demo/index.html`, `developers/index.html`, `ad-submission/index.html`, `css/styles.css`.
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
