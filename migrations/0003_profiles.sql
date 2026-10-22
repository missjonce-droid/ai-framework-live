-- AI Framework — D1 migration 0003: AI Pages (profiles + publishing)
-- Additive only. Safe to apply before the code ships: all new API paths
-- fail soft (503) until these columns/tables exist, and no existing
-- query references them.
-- Apply in Cloudflare dashboard: Workers & Pages -> D1 -> aiframeworkdb -> Console.

ALTER TABLE users ADD COLUMN handle TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN ai_about TEXT;
CREATE UNIQUE INDEX idx_users_handle ON users(handle);

ALTER TABLE frameworks ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;
ALTER TABLE frameworks ADD COLUMN outcome_note TEXT;

CREATE TABLE framework_forks (
  framework_id TEXT NOT NULL REFERENCES frameworks(id),
  forker_user_id TEXT NOT NULL REFERENCES users(id),
  new_framework_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (framework_id, forker_user_id)
);
CREATE INDEX idx_forks_framework ON framework_forks(framework_id);
