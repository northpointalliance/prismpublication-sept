# GEO / AEO notes for this site

Operator notes. Do not paste this file onto the live homepage. The page must read as a product page, not as a citation playbook.

## Host

- Canonical origin: `https://prismpublication.com/`
- Homepage canonical ends with `/`
- Internal hashes (`#sandbox`, `#demos`) are allowed
- No `www`, no `http://`, no query strings on canonicals
- Sitemap lists only 200 URLs on that origin

## What crawlers must see in view-source

- Hero, sandbox explanation, demo transcripts, and Q&A sections as static HTML
- The demo script may rewrite cards inside the `[data-chat-log]` thread on Play/Reset. The demos and AEO sections stay in the first response
- Prices and affiliate disclosure as text, not as a canvas
- JSON-LD in `<head>` that matches visible copy (`WebSite`, `Organization`, `FAQPage`, `Person` author)

## Page intent

One commercial intent, as of 17 September 2026: **the site's own live chat, open to any visitor, with contextual ads for advertisers who submit and test free before paying per click**. The SDK/GAM story for wiring ads onto someone else's chatbot still exists (`/developers/`), but it is not the homepage's focus and should not dominate this page's copy. Do not mix support-bot scoring or other Prism product lines onto this homepage either.

## Section pattern on `index.html`

Each long-form block:

1. Question-based H2
2. Two or three sentence answer
3. Supporting detail
4. Close in the last paragraph (no `TLDR` label)
5. An internal link when it helps this page

Target 120–180 words per H2 block. Refresh or re-evaluate inside three months. `dateModified` in HTML and JSON-LD must move when the copy does.

## Bots

`robots.txt` allows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended. Do not block them to “protect” GEO.

## Punctuation

Prefer commas, colons, periods, and `|` in titles. Grep for `—` before ship. Keep the count near zero.

**This applies to body copy too, and to the ASCII `" -- "` substitute, not just the real em dash.** A real `—` reads as an AI-writing tell; a literal `" -- "` rendered in a sentence a visitor reads reads as a typo instead, which is arguably worse. Neither belongs in visible copy on a public page -- write two sentences, or use a comma, colon, or semicolon. Grep `grep -rn ' -- ' --include="*.html"` (excluding JS `//` comments, which aren't visitor-facing) before shipping copy changes, same as the em-dash grep. This rule is public-copy only: internal docs (this file included), `mem/current.md`, commit messages, and code comments can read however's clearest -- `" -- "` there is fine and expected.

## Demo vs production claims

Public floors to print: cosine similarity **0.65**, matching budget **under 120ms**. The homepage/`/demo/` thread is a scripted, local-catalog playback (Play/Reset, no free-text input) that shows message/ad counts only, not a score or timing readout. It is not a live auction. Do not invent fill rate or monthly visitor counts.

## Deploy

Static files at repo root on **Cloudflare Pages**. Not Vercel. Not Workers static assets for this repo. No client-side fetch of the article body.

## Related public URLs

- https://prismpublication.com/
- https://prismpublication.com/demo/
- https://prismpublication.com/developers/
- https://prismpublication.com/ad-submission/
