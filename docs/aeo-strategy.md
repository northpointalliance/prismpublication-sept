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
- The simulator may rewrite a card in `#sandbox-output`. The demos and AEO sections stay in the first response
- Prices and affiliate disclosure as text, not as a canvas
- JSON-LD in `<head>` that matches visible copy (`WebSite`, `Organization`, `FAQPage`, `Person` author)

## Page intent

One commercial intent: **native ads and SDK matching for independent AI chatbots**. Do not mix support-bot scoring or other Prism product lines onto this homepage.

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

## Sandbox vs production claims

Public floors to print: cosine similarity **0.65**, matching budget **under 120ms**. The sandbox is a local catalog that reports score and `performance.now()` elapsed time. It is not a live auction. Do not invent fill rate or monthly visitor counts.

## Deploy

Static files at repo root on **Cloudflare Pages**. Not Vercel. Not Workers static assets for this repo. No client-side fetch of the article body.

## Related public URLs

- https://prismpublication.com/
- https://prismpublication.com/demo/
- https://prismpublication.com/developers/
- https://prismpublication.com/ad-submission/
