# Carry-forward | prismpublication-sept

This repo is the live static site. It is not the hub. There is no `apps/memory` Worker here. Next session starts from this file, not from another rebuild.

## Locked public site

- Origin: https://prismpublication.com/
- Host: Cloudflare Pages on GitHub `main`. Build `echo "Building static site"`. Never Wrangler deploy.
- Pages: `index.html`, `demo/index.html`, `developers/index.html`, `ad-submission/index.html`, `css/styles.css`.
- Visitor demo is the **phone thread** (Play/Reset, composer off). Not the category form.
- Page wash `#f0f9ff`. No full-width white then blue then white bands. Marketing cards match the page. Phone screen stays white.
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
