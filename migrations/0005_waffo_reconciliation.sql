-- Additive recovery audit, not a webhook receipt. Apply only after semantic
-- verification of 0001/0004 tables; never blindly replay historical migrations.
CREATE TABLE IF NOT EXISTS waffo_reconciliation_audits (
 id TEXT PRIMARY KEY,
 provenance TEXT NOT NULL CHECK (provenance = 'provider_read'),
 intent_id TEXT NOT NULL REFERENCES checkout_intents(id),
 user_id TEXT NOT NULL REFERENCES users(id),
 store_id TEXT NOT NULL,
 order_id TEXT NOT NULL REFERENCES waffo_subscriptions(order_id) DEFERRABLE INITIALLY DEFERRED,
 payment_id TEXT NOT NULL,
 plan_id TEXT NOT NULL,
 product_id TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
 currency TEXT NOT NULL,
 period_number INTEGER NOT NULL CHECK (period_number > 0),
 period_start TEXT NOT NULL,
 period_end TEXT NOT NULL,
 provider_status TEXT NOT NULL CHECK (provider_status IN ('active','canceling')),
 evidence_sha256 TEXT NOT NULL,
 observed_at TEXT NOT NULL,
 UNIQUE (order_id,period_start),
 UNIQUE (order_id,period_number)
);
CREATE INDEX IF NOT EXISTS idx_waffo_reconciliation_user ON waffo_reconciliation_audits(user_id,observed_at);
