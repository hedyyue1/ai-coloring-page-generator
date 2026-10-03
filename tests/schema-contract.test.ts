import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = new URL('../migrations/0001_auth_creem.sql', import.meta.url)
const retryMigrationPath = new URL('../migrations/0002_webhook_retry_claim.sql', import.meta.url)

test('D1 migration enforces identity, session, webhook, subscription and ledger idempotency', async () => {
  const sql = await readFile(migrationPath, 'utf8')
  const required = [
    'UNIQUE (issuer, subject)',
    'CREATE TABLE sessions',
    'session_hash TEXT PRIMARY KEY',
    'CREATE TABLE checkout_intents',
    'request_id TEXT NOT NULL UNIQUE',
    'CREATE TABLE creem_webhook_events',
    'event_id TEXT PRIMARY KEY',
    'attempt_count INTEGER NOT NULL DEFAULT 0',
    'claimed_at TEXT',
    'CREATE TABLE subscriptions',
    'creem_subscription_id TEXT NOT NULL UNIQUE',
    'CREATE TABLE billing_cycles',
    'UNIQUE (creem_subscription_id, period_start, period_end)',
    'CREATE TABLE entitlement_ledger',
    'idempotency_key TEXT NOT NULL UNIQUE',
  ]
  for (const marker of required) assert.match(sql, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

test('follow-up migration repairs retry claim columns for databases created before the schema was finalized', async () => {
  const sql = await readFile(retryMigrationPath, 'utf8')
  assert.match(sql, /ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0/)
  assert.match(sql, /ADD COLUMN claimed_at TEXT/)
})

test('D1 migration never stores Google OAuth tokens or raw webhook bodies', async () => {
  const sql = (await readFile(migrationPath, 'utf8')).toLowerCase()
  for (const forbidden of ['access_token', 'refresh_token', 'id_token', 'raw_body', 'card_number', 'cvv']) {
    assert.equal(sql.includes(forbidden), false, forbidden)
  }
})
