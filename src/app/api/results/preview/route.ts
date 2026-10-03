import { apiError, apiJson } from '@/lib/api-response'
import { cloudflareEnv } from '@/lib/cloudflare'

const MAX_RESULT_BYTES = 8 * 1024 * 1024

function decode(value: unknown): Uint8Array | null {
  if (typeof value !== 'string') return null
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(value)
  if (!match || match[1].length > Math.ceil(MAX_RESULT_BYTES * 4 / 3)) return null
  try {
    const raw = atob(match[1])
    if (!raw || raw.length > MAX_RESULT_BYTES) return null
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
    return bytes
  } catch { return null }
}

export async function POST(request: Request) {
  const env = await cloudflareEnv()
  let body: { image_data?: unknown }
  try { body = await request.json() as { image_data?: unknown } } catch { return apiError('invalid_request', 400, 'Invalid generated preview.') }
  const png = decode(body.image_data)
  if (!png) return apiError('invalid_result', 400, 'Only a generated PNG preview can be stored.')
  const id = crypto.randomUUID()
  const copy = new Uint8Array(png.byteLength); copy.set(png)
  await env.GENERATED_PREVIEWS.put(`generated/${id}.png`, copy.buffer, { httpMetadata: { contentType: 'image/png' }, customMetadata: { expires_at: new Date(Date.now() + 86400000).toISOString() } })
  return apiJson({ preview_id: id, expires_at: new Date(Date.now() + 86400000).toISOString() }, 201)
}
