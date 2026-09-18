-- D1 database: prism-crm (existing, previously empty)
-- Run once against the real database:
--   wrangler d1 execute prism-crm --remote --file d1/schema.sql
-- (--remote targets the live Cloudflare database, not local emulation)

CREATE TABLE IF NOT EXISTS ad_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | auto_cleared | needs_review | approved | rejected
  brand TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  budget_note TEXT,
  review_notes TEXT,
  keywords TEXT, -- space-separated extra terms for matching (see functions/api/match.js)
  paypal_order_id TEXT, -- kept from the retired $5-at-submission fee; unused since Stage 5
  amount_paid_cents INTEGER -- ditto; new rows leave both null, submission is free now
);

-- Added 14 September 2026, after live testing showed category+title+description
-- alone was too sparse for the 0.65 cosine floor to clear on realistic queries.
-- Already applied to the real database:
--   ALTER TABLE ad_submissions ADD COLUMN keywords TEXT;
-- Also already applied (dates lost -- this file drifted from the real schema
-- until 17 September 2026, when it was corrected to match):
--   ALTER TABLE ad_submissions ADD COLUMN paypal_order_id TEXT;
--   ALTER TABLE ad_submissions ADD COLUMN amount_paid_cents INTEGER;

-- Added 17 September 2026, for the visitor-facing chat at /run-ads (Stage 2
-- of docs/run-ads-strategy-2026-09-16.md). Logs both chat turns and card
-- clicks; also doubles as the rate-limit store for functions/api/chat.js
-- (no separate KV namespace -- traffic is far too low to need one).
-- Run once against the real database:
--   wrangler d1 execute prism-crm --remote --file d1/schema.sql
CREATE TABLE IF NOT EXISTS chat_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL DEFAULT 'chat', -- chat | click
  session_id TEXT,
  ip_hash TEXT,
  message TEXT, -- only for kind = 'chat'; visible privacy notice covers this on /run-ads
  matched_ad_id INTEGER,
  score REAL,
  answer_chars INTEGER
);

CREATE INDEX IF NOT EXISTS idx_chat_events_ip_hash_created ON chat_events (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_events_session ON chat_events (session_id, created_at);

-- Added 17 September 2026, for the "paste a product URL, get a draft ad"
-- builder on /run-ads (Stage 3 of docs/run-ads-strategy-2026-09-16.md).
-- A draft here is private to the session that created it -- functions/api/
-- chat.js scores it alongside the public approved pool but never returns
-- it to any other session. Expired rows are deleted lazily by draft-ad.js
-- on each call (no separate cleanup Worker at this traffic level).
-- Run once against the real database:
--   wrangler d1 execute prism-crm --remote --file d1/schema.sql
CREATE TABLE IF NOT EXISTS test_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  session_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  brand TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  category TEXT,
  destination_url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_ads_session ON test_ads (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_test_ads_expires ON test_ads (expires_at);

-- Added 17 September 2026, for Stage 5 (prepaid credit / pay-per-click) of
-- docs/run-ads-strategy-2026-09-16.md. Submitting a campaign is free now
-- (the $5 fee above is retired); the only charge is prepaid click credit,
-- bought via the token-based campaign page (functions/campaign/[token].js)
-- once a submission is approved -- there's no account system, so that
-- bookmarkable link is the only way an advertiser finds their way back.
-- Run once against the real database:
--   wrangler d1 execute prism-crm --remote --file d1/schema.sql
ALTER TABLE ad_submissions ADD COLUMN access_token TEXT;
ALTER TABLE ad_submissions ADD COLUMN credit_active INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_submissions_access_token ON ad_submissions (access_token);

-- Balance is SUM(amount_cents) per ad_submission_id -- never a stored
-- running total, so it can't drift from the actual history of charges.
CREATE TABLE IF NOT EXISTS credit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ad_submission_id INTEGER NOT NULL,
  kind TEXT NOT NULL, -- purchase | click | refund
  amount_cents INTEGER NOT NULL, -- positive for purchase/refund, negative for click
  paypal_order_id TEXT,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_ad ON credit_ledger (ad_submission_id, created_at);

-- Added 18 September 2026. Holds both affiliate ads and paid ads in one
-- pool so the matcher can score them together. A paid ad links back to its
-- ad_submissions row via ad_submission_id instead of duplicating brand/
-- title/description/cta_text -- ad_submission_id is the source of truth
-- for those fields on a paid row, this table only adds source/niche/
-- promo_code/affiliate_program/active on top. An affiliate ad has no
-- ad_submissions row at all (nobody submitted it through that flow), so
-- it carries its own brand_name/title/description/destination_url/
-- cta_text directly.
-- Already applied to the real database.
-- Run once against the real database:
--   wrangler d1 execute prism-crm --remote --file d1/schema.sql
CREATE TABLE IF NOT EXISTS ad_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL CHECK (source IN ('affiliate', 'paid')),
  niche TEXT NOT NULL,
  ad_submission_id INTEGER, -- set only when source = 'paid'; links instead of duplicating
  brand_name TEXT, -- affiliate rows only; paid rows read brand from ad_submissions
  title TEXT, -- affiliate rows only; paid rows read title from ad_submissions
  description TEXT, -- affiliate rows only; paid rows read description from ad_submissions
  destination_url TEXT, -- affiliate rows only, must be https; paid rows read from ad_submissions
  cta_text TEXT, -- affiliate rows only; paid rows read cta_text from ad_submissions
  promo_code TEXT,
  affiliate_program TEXT, -- which program this affiliate row belongs to, e.g. "Amazon Associates"
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ad_library_active ON ad_library (active, source);
CREATE INDEX IF NOT EXISTS idx_ad_library_submission ON ad_library (ad_submission_id);

-- Added 18 September 2026, same day, once real affiliate rows were seeded
-- and tested: a title + one description sentence was too thin to clear the
-- 0.65 floor on realistic phrasing (the exact problem ad_submissions.keywords
-- was added to fix on 14 September). Affiliate rows only -- a paid row's
-- matching text lives on its linked ad_submissions row instead.
-- Already applied to the real database.
ALTER TABLE ad_library ADD COLUMN keywords TEXT;

-- Added 18 September 2026, when the matcher (_lib/matcher.js) was wired to
-- also serve ad_library affiliate rows. matched_ad_id already assumes an
-- ad_submissions id, and an ad_library row has its own, separate id space
-- -- so a winning affiliate match is logged here instead, never mixed into
-- matched_ad_id. Affiliate ads have no credit_ledger or billing, so there's
-- nothing else to add alongside it.
-- Already applied to the real database.
ALTER TABLE chat_events ADD COLUMN matched_library_id INTEGER;
