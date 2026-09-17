// Single source of truth for money amounts, so nothing is hardcoded
// elsewhere. Stage 5 of docs/run-ads-strategy-2026-09-16.md: submitting
// and testing an ad is free; the only charge is prepaid click credit,
// bought once a campaign is approved, spent as clicks come in.
//
// PLACEHOLDER VALUES -- Daniel sets the real numbers. Nothing here is
// live pricing yet; change these two exports and every page/endpoint
// that quotes a price reads from here, no other code change needed.

export const CREDIT_PACKS_CENTS = [1000, 2500, 5000]; // $10 / $25 / $50
export const PRICE_PER_CLICK_CENTS = 50; // $0.50/click -- placeholder

export function formatUsd(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}
