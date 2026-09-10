# Pricing: intercept active AI campaign buyers

Operator model for Prism Publication as of 9 September 2026. This file is not a public rate card. Do not invent CPCs, take rates, or fill percentages on the homepage. Quote only the matching floors already on [index.html](../index.html) and [ad-submission.md](ad-submission.md).

**Prism sells labeled chat inventory next to independent assistants, billed only when a card actually serves.** The commercial motion is no longer “stand up a two-sided marketplace and wait for new advertisers.” It is intercept: take a slice of budget from buyers who already run AI and conversation campaigns (ChatGPT Ads, other chat-card programs, and adjacent AI search or assistant placements) and place the same intent on Prism bots when cosine similarity is at least 0.65.

## Who is the buyer now?

The buyer is a brand, agency, or performance team with an **active AI campaign**, not a cold lead who has never bought conversation ads. They already have creative, a daily or lifetime budget, and a measurement habit. Prism is extra inventory in that same intent, on independent chatbots the walled gardens do not cover.

Do not lead with publisher SDK onboarding as the revenue story. Publishers still wire [sdk/prismClient.js](../sdk/prismClient.js). Money starts when an existing campaign owner funds a Prism line against that inventory.

## What do we charge for?

Charge for **served, labeled cards** only. A fill is a card the publisher rendered after `displayAd` returned a creative. Null is not billable. Timeouts that fail closed are not billable. Matcher debug (cosine, advertiser name, milliseconds) must never appear on the card a user sees.

Allowed commercial units, in order of preference for intercept buyers:

| Unit | When to use | What must be true |
|---|---|---|
| Cost per click on the labeled card | Buyer already optimizes AI chat cards on CPC | Click URL is https, disclosed, `rel="sponsored"` when affiliate |
| Cost per impression of a rendered card | Buyer’s AI line is impression-priced | Impression fires only after the card is in the transcript |
| Budget transfer / insertion order | Agency moves a cap from an existing AI campaign | Daily and lifetime caps required; exhausted ads leave the pool |

Do not sell CPM on chat turns that never showed an ad. Do not sell a SaaS seat as the primary product. Do not sell “fill rate.”

Amazon Associates (`prismpublicat-20`) is a **fallback catalog**, not the intercept product. Brand and agency IO spend sits above affiliate house ads. Affiliate clicks remain disclosed and tagged. They do not replace a funded campaign.

## How does intercept change the deal shape?

**Old shape:** recruit advertisers onto Prism, then recruit bots, then hope both sides show up. **Current shape:** find spend that is already live on AI campaign surfaces, map their creative to allowed Prism categories, and serve only on prompt overlap.

Sales conversation, in order:

1. Name the live AI campaign and its category (fitness, sleep tools, productivity, or another reviewed niche).
2. Port title, description, destination, and budget caps into Prism review. See [ad-submission.md](ad-submission.md).
3. Wire one publisher bot that already sees that intent.
4. Bill the unit they already buy (click or rendered impression). Stop the line when the cap hits or cosine stays below 0.65.

Prism’s cut is a **share of billed fill**, agreed on the IO. Publishers earn the remainder on those same fills. Write the split on the IO. Do not publish a default percentage until a human sets one.

## What stays free and what stays out of scope?

The homepage sandbox, cosine floor (0.65), and 120ms matching budget are **contract proof**, not a paid SKU. This Pages site does not issue publisher API keys. Contact [info@prismpublication.com](mailto:info@prismpublication.com) for an IO or GAM, not a Bearer token.

Out of scope for this model: support-bot scoring, crisis language products, and any fee that fires when the SDK returns null. Political campaigning and the other rejects in ad-submission stay unsellable.

When copy on this file changes, bump the date in this paragraph and keep public HTML honest: no dollar figures on [index.html](../index.html) until an IO number is real.
