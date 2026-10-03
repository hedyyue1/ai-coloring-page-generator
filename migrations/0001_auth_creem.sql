PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (issuer, subject)
);

CREATE TABLE sessions (
  session_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id, expires_at);

CREATE TABLE checkout_intents (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  expected_amount_cents INTEGER NOT NULL,
  expected_currency TEXT NOT NULL,
  mode TEXT NOT NULL,
  state TEXT NOT NULL,
  creem_checkout_id TEXT,
  creem_order_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE creem_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  processing_state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  claimed_at TEXT,
  error_code TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  creem_subscription_id TEXT NOT NULL UNIQUE,
  creem_order_id TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_subscriptions_order ON subscriptions(creem_order_id) WHERE creem_order_id IS NOT NULL;

CREATE TABLE billing_cycles (
  id TEXT PRIMARY KEY,
  creem_subscription_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  credits_granted INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (creem_subscription_id, period_start, period_end)
);

CREATE TABLE entitlement_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  delta INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  reference_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_entitlement_user ON entitlement_ledger(user_id, created_at);
