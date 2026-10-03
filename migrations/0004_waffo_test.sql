-- Additive, rerunnable. Existing Creem tables and migration history are untouched.
CREATE TABLE IF NOT EXISTS waffo_checkout_links (
 intent_id TEXT PRIMARY KEY REFERENCES checkout_intents(id),
 store_id TEXT NOT NULL,
 session_id TEXT UNIQUE,
 order_id TEXT UNIQUE
);
CREATE TABLE IF NOT EXISTS waffo_webhook_events (
 event_id TEXT PRIMARY KEY,
 event_type TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 state TEXT NOT NULL,
 received_at TEXT NOT NULL,
 processed_at TEXT
);
CREATE TABLE IF NOT EXISTS waffo_subscriptions (
 order_id TEXT PRIMARY KEY,
 intent_id TEXT NOT NULL UNIQUE REFERENCES checkout_intents(id),
 user_id TEXT NOT NULL REFERENCES users(id),
 plan_id TEXT NOT NULL,
 product_id TEXT NOT NULL,
 status TEXT NOT NULL,
 period_start TEXT,
 period_end TEXT,
 event_timestamp TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS waffo_billing_cycles (
 order_id TEXT NOT NULL REFERENCES waffo_subscriptions(order_id),
 period_start TEXT NOT NULL,
 period_end TEXT NOT NULL,
 user_id TEXT NOT NULL REFERENCES users(id),
 plan_id TEXT NOT NULL,
 credits_granted INTEGER NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY (order_id, period_start),
 UNIQUE (order_id, period_end)
);
