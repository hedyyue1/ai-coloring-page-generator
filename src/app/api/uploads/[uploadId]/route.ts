import { apiError, apiJson } from '@/lib/api-response'
import { requireSession } from '@/lib/auth-server'
import { cloudflareEnv } from '@/lib/cloudflare'
import { validateBrowserWrite } from '@/lib/request-security'

function magic(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg'
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

export async function PUT(request: Request, { params }: { params: Promise<{ uploadId: string }> }) {
  const env = await cloudflareEnv()
  const user = await requireSession(env, request)
  if (!user) return apiError('authentication_required', 401, 'Sign in to continue.')
  const writeError = await validateBrowserWrite(env, request)
  if (writeError) return writeError
  const { uploadId } = await params
  const intent = await env.DB.prepare('SELECT object_key, declared_mime, declared_bytes, expires_at FROM upload_intents WHERE id = ? AND user_id = ? AND state = \'pending\'')
    .bind(uploadId, user.id).first<{ object_key: string; declared_mime: string; declared_bytes: number; expires_at: string }>()
  if (!intent || intent.expires_at <= new Date().toISOString()) return apiError('resource_not_found', 404, 'Upload was not found.')
  const body = new Uint8Array(await request.arrayBuffer())
  const detected = magic(body)
  if (!detected || detected !== intent.declared_mime) return apiError('file_validation_failed', 422, 'File content does not match the approved image type.')
  if (body.byteLength !== intent.declared_bytes || body.byteLength > 10 * 1024 * 1024) return apiError('upload_too_large', 413, 'The image size is invalid.')
  if (!env.GENERATED_PREVIEWS) return apiError('service_not_configured', 503, 'Private upload storage is not configured.')
  await env.GENERATED_PREVIEWS.put(intent.object_key, body, { httpMetadata: { contentType: detected } })
  const assetId = `ast_${crypto.randomUUID()}`
  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare('INSERT INTO assets (id, user_id, upload_id, purpose, object_key, mime, bytes, state, created_at) VALUES (?, ?, ?, \'input\', ?, ?, ?, \'ready\', ?)').bind(assetId, user.id, uploadId, intent.object_key, detected, body.byteLength, now),
    env.DB.prepare('UPDATE upload_intents SET state = \'uploaded\', updated_at = ? WHERE id = ?').bind(now, uploadId),
  ])
  return apiJson({ data: { upload_id: uploadId, asset_id: assetId, state: 'ready' } })
}
