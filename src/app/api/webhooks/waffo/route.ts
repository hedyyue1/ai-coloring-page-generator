import { cloudflareEnv } from '@/lib/cloudflare'
import { handleWaffoWebhook } from '@/lib/waffo-payment'

export async function POST(request: Request) {
  return handleWaffoWebhook(await cloudflareEnv(), request)
}
