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
  keywords TEXT -- space-separated extra terms for matching (see functions/api/match.js)
);

-- Added 14 September 2026, after live testing showed category+title+description
-- alone was too sparse for the 0.65 cosine floor to clear on realistic queries.
-- Already applied to the real database:
--   ALTER TABLE ad_submissions ADD COLUMN keywords TEXT;

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
