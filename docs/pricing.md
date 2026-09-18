# Pricing: what's actually built, as of 18 September 2026

This file describes the real, live model. It previously described a
different, abandoned model (revenue-share insertion orders, "intercept
active AI campaign buyers," CPM as an allowed unit) from the earlier
third-party-chatbot-developer MVP. That model was never built. Do not
resurrect language from an older version of this file.

**Prism Publication sells labeled sponsored cards in its own live chat
at `/run-ads/`, billed flat per click, prepaid.** There is no revenue
share, no insertion order, no sales team, no CPM option. See
`mem/current.md` for the full decision history.

## The actual flow

1. Advertiser submits a campaign at `/ad-submission/`. **Free**, no fee,
   no card required.
2. `functions/api/_lib/screening.js` screens it: auto-clear, send to
   manual review (gambling always goes here, along with anything
   uncertain), or reject outright (weapons, explosives, political
   campaigning, impersonation, alcohol/adult without age-gating,
   medical/legal advice as a recommendation).
3. Once approved, the advertiser tests it for free against real
   questions in the same live chat, as many times as they want.
4. To go live, the advertiser sets their **own budget**: they type
   whatever dollar amount they want to add as prepaid credit on their
   campaign's own page (`/campaign/:token`), **$5.00 minimum**
   (`MIN_CREDIT_PURCHASE_CENTS` in `functions/api/_lib/pricing.js`).
   There is no fixed set of packs to choose from.
5. Every real visitor click on their sponsored card deducts a flat,
   non-negotiable amount from that credit (`PRICE_PER_CLICK_CENTS`,
   still an explicit placeholder, not a real number yet).
6. When the balance drops below one click's cost, the campaign stops
   showing automatically. No negative balance, no auto-rebill.

## What we do NOT charge for

- **Submitting** a campaign
- **Testing** a campaign in the live chat, unlimited
- **Impressions.** A card can show any number of times without a
  click and nothing is billed. There is no CPM option on this
  product, deliberately: see the "Why isn't this priced per 1,000
  impressions?" FAQ on `/ad-submission/` for the public reasoning
  (impressions don't reflect follow-through the way a click on an
  already-contextual match does).
- **A turn where no card shows at all.** The bot still answers; if
  nothing matched closely enough, that turn is free.

## What's still a placeholder, not a real number

`functions/api/_lib/pricing.js` has two exports:

- `MIN_CREDIT_PURCHASE_CENTS = 500` -- this one is real, confirmed
  directly by Daniel (18 September 2026).
- `PRICE_PER_CLICK_CENTS = 50` -- **still a placeholder.** Change this
  one constant when a real per-click price is set; every page and
  endpoint that quotes it reads from here, no other code change
  needed.
- `MAX_CREDIT_PURCHASE_CENTS = 200000` ($2,000) exists only as a
  fat-finger guardrail on the amount input, not a business decision.
  Raise it if a real advertiser needs a bigger single top-up.

## Out of scope for this model

The old SDK/Google Ad Manager story for wiring Prism ads onto a
third-party publisher's own chatbot (`/developers/`) still exists as
code and a page, but it is not an active revenue channel right now.
Daniel has said explicitly it's kept for site authority/SEO, not
because it's being sold. Don't invent a rate card, revenue split, or
sales process for it, none exists.
