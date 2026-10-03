import { apiError, apiJson } from '@/lib/api-response'
import { cloudflareEnv } from '@/lib/cloudflare'

// Project-approved hosts, not Host/X-Forwarded-Host or arbitrary SITE_URL input.
const ORIGINS = new Set([
  'https://coloringpageflow.com',
  'https://www.coloringpageflow.com',
  'https://ai-coloring-page-generator.hedyyue1.workers.dev',
])
const CATEGORIES = new Set(['account', 'payment', 'generation', 'deletion', 'refund', 'complaint', 'other'])
const MAX_BODY_BYTES = 16 * 1024

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin || !ORIGINS.has(origin)) return false
  const url = new URL(request.url)
  return url.origin === origin && !url.username && !url.password &&
    (!request.headers.has('sec-fetch-site') || request.headers.get('sec-fetch-site') === 'same-origin')
}

async function readBody(request: Request): Promise<unknown | Response> {
  const reader = request.body?.getReader()
  if (!reader) return apiError('invalid_json', 400, 'Request body must be valid JSON.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        return apiError('support_body_too_large', 413, 'Request body must be 16 KiB or smaller.')
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    return apiError('invalid_json', 400, 'Request body must be valid JSON.')
  } finally { reader.releaseLock() }
}

export async function POST(request: Request) {
  // Strict Origin + JSON-only requests prevent browser CSRF without requiring
  // a session-bound token: this endpoint deliberately works for anonymous users.
  if (!sameOrigin(request)) return apiError('origin_forbidden', 403, 'Request origin is not allowed.')
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return apiError('unsupported_media_type', 415, 'Use application/json.')
  }
  const body = await readBody(request)
  if (body instanceof Response) return body
  if (!body || typeof body !== 'object' || Array.isArray(body)) return apiError('invalid_support_fields', 400, 'Invalid support fields.')
  const fields = body as Record<string, unknown>
  const invalid = () => apiError('invalid_support_fields', 400, 'Invalid support fields.')
  if (Object.keys(fields).some(key => !['category', 'email', 'reference', 'message'].includes(key))) return invalid()
  if (typeof fields.category !== 'string' || !CATEGORIES.has(fields.category) ||
      typeof fields.email !== 'string' || typeof fields.message !== 'string' ||
      (fields.reference !== undefined && fields.reference !== null && typeof fields.reference !== 'string')) return invalid()
  const email = fields.email.trim().toLowerCase()
  const message = fields.message.trim()
  const messageLength = Array.from(message).length // Match SQLite length() code points, not UTF-16 units.
  const reference = typeof fields.reference === 'string' ? fields.reference.trim() || null : null
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email) ||
      email.split('@')[0].length > 64 || email.startsWith('.') || email.includes('..') || email.includes('.@') ||
      messageLength < 10 || messageLength > 4000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message) ||
      (reference !== null && !/^[a-zA-Z0-9_.:-]{1,128}$/.test(reference))) return invalid()
  const ticketId = `sup_${crypto.randomUUID()}`
  try {
    const env = await cloudflareEnv()
    const now = new Date()
    const since = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    // One conditional INSERT: D1 serializes writes, so concurrent submissions
    // cannot slip between a separate quota read and insert. No IP/UA stored.
    const result = await env.DB.prepare(`
      INSERT INTO support_requests (ticket_id, category, email, reference, message, created_at)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE (SELECT count(*) FROM support_requests WHERE email = ? AND created_at > ?) < 3
        AND (SELECT count(*) FROM support_requests WHERE created_at > ?) < 100
    `).bind(ticketId, fields.category, email, reference, message, now.toISOString(), email, since, since).run()
    if (!result.success || (result.meta.changes !== 0 && result.meta.changes !== 1)) throw new Error('support_write_failed')
    if (result.meta.changes === 0) {
      const response = apiError('support_rate_limited', 429, 'Too many support submissions. Please try again later.', true)
      response.headers.set('retry-after', '3600')
      return response
    }
    return apiJson({ data: { ticket_id: ticketId } }, 201)
  } catch {
    return apiError('support_unavailable', 503, 'Support submission is temporarily unavailable.', true)
  }
}
