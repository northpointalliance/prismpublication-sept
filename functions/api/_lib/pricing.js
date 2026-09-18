// Single source of truth for money amounts, so nothing is hardcoded
// elsewhere. Stage 5 of docs/run-ads-strategy-2026-09-16.md: submitting
// and testing an ad is free; the only charge is prepaid click credit,
// bought once a campaign is approved, spent as clicks come in.
//
// The advertiser sets their own budget -- there's no fixed set of credit
// packs, they type whatever amount they want to add, with a $5.00 floor
// (confirmed by Daniel, 18 September 2026). PRICE_PER_CLICK_CENTS is
// still an explicit placeholder -- change it and every page/endpoint
// that quotes a per-click price reads from here, no other code change
// needed.

export const MIN_CREDIT_PURCHASE_CENTS = 500; // $5.00 minimum spend
export const MAX_CREDIT_PURCHASE_CENTS = 200000; // $2,000 -- fat-finger guardrail, not a business limit
export const PRICE_PER_CLICK_CENTS = 50; // $0.50/click -- placeholder

export function formatUsd(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}
