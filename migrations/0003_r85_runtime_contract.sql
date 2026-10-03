PRAGMA foreign_keys = ON;

ALTER TABLE sessions ADD COLUMN csrf_hash TEXT;

CREATE TABLE idempotency_records (
  user_id TEXT NOT NULL REFERENCES users(id),
  route TEXT NOT NULL,
  key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json TEXT,
  response_status INTEGER,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, route, key)
);

CREATE TABLE upload_intents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  object_key TEXT NOT NULL UNIQUE,
  declared_mime TEXT NOT NULL,
  declared_bytes INTEGER NOT NULL,
  rights_confirmed INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','uploaded','rejected','expired')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_upload_intents_owner ON upload_intents(user_id, created_at);

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  upload_id TEXT UNIQUE REFERENCES upload_intents(id),
  purpose TEXT NOT NULL CHECK(purpose IN ('input','result')),
  object_key TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('ready','deleted')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_assets_owner ON assets(user_id, created_at);

CREATE TABLE generation_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  idempotency_key TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('photo','text')),
  input_asset_id TEXT REFERENCES assets(id),
  state TEXT NOT NULL CHECK(state IN ('pending','queued','processing','completed','failed','rejected','cancelled','expired')),
  credit_state TEXT NOT NULL CHECK(credit_state IN ('none','reserved','released','consumed')),
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, idempotency_key)
);
CREATE INDEX idx_generation_jobs_owner ON generation_jobs(user_id, created_at);
