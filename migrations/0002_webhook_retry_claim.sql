-- Repair databases that applied 0001 before webhook retry ownership columns were finalized.
ALTER TABLE creem_webhook_events
  ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE creem_webhook_events
  ADD COLUMN claimed_at TEXT;
