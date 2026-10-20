-- AI Framework — email capture (newsletter / lead magnet subscribers)
-- Apply in Cloudflare dashboard: Workers & Pages -> D1 -> aiframeworkdb -> Console,
-- or: npx wrangler d1 execute <database> --file=migrations/0002_subscribers.sql
-- Run AFTER 0001_initial.sql.

CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  unsubscribed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_subscribers_created ON email_subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON email_subscribers(source);
