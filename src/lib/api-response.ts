const PRIVATE_HEADERS = {
  'cache-control': 'no-store, private',
  'x-robots-tag': 'noindex, nofollow, noarchive',
}

export function apiJson(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: PRIVATE_HEADERS })
}

export function apiError(code: string, status: number, message: string, retryable = false): Response {
  return apiJson({ error: { code, message, retryable } }, status)
}

export function privateRedirect(url: string, status = 307): Response {
  return new Response(null, { status, headers: { ...PRIVATE_HEADERS, location: url } })
}
