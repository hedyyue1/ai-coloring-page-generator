CREATE TABLE support_requests (
  ticket_id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('account', 'payment', 'generation', 'deletion', 'refund', 'complaint', 'other')),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  reference TEXT CHECK (reference IS NULL OR length(reference) BETWEEN 1 AND 128),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 10 AND 4000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_support_created ON support_requests(created_at);
CREATE INDEX idx_support_email_created ON support_requests(email, created_at);
