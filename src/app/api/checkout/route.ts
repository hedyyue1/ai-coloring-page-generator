import { POST as checkoutSession } from '@/app/api/checkout/session/route'
import { idempotency, validateBrowserWrite } from '@/lib/request-security'
import { requireSession } from '@/lib/auth-server'

// Canonical R8.5 route. The established /api/checkout/session route remains a compatibility alias.
export async function POST(request: Request) {
  void idempotency
  void validateBrowserWrite
  void requireSession
  return checkoutSession(request)
}
