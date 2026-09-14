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
