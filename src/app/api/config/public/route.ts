import { apiJson } from '@/lib/api-response'
import { catalogPlan } from '@/lib/creem-core'
import { cloudflareEnv } from '@/lib/cloudflare'
import { waffoProductBinding } from '@/lib/waffo-core'

function publicConfig(env: CloudflareEnv) {
  const useWaffo = Boolean(env.WAFFO_MODE)
  const checkoutConfigured = useWaffo
    ? Boolean(env.WAFFO_MODE === 'test' && env.PAYMENTS_TEST_MODE === 'true' && env.DB && env.WAFFO_MERCHANT_ID && env.WAFFO_PRIVATE_KEY_TEST && env.WAFFO_STORE_ID_TEST)
    : Boolean(env.CREEM_MODE === 'test' && env.PAYMENTS_TEST_MODE === 'true' && env.CREEM_API_KEY)
  const webhookConfigured = useWaffo
    ? Boolean(env.WAFFO_MODE === 'test' && env.PAYMENTS_TEST_MODE === 'true' && env.DB && env.WAFFO_WEBHOOK_PUBLIC_KEY_TEST && env.WAFFO_STORE_ID_TEST)
    : Boolean(env.CREEM_MODE === 'test' && env.PAYMENTS_TEST_MODE === 'true' && env.CREEM_WEBHOOK_SECRET)
  return {
    auth: { enabled: env.AUTH_ENABLED === 'true', configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.AUTH_SECRET && env.DB) },
    payments: {
      enabled: env.PAYMENTS_ENABLED === 'true',
      provider: useWaffo ? 'waffo' : 'creem',
      mode: (useWaffo ? env.WAFFO_MODE === 'test' : env.CREEM_MODE === 'test') ? 'test' : 'unconfigured',
      configured: checkoutConfigured && webhookConfigured,
      checkout_configured: checkoutConfigured,
      webhook_configured: webhookConfigured,
      plans: ['starter_monthly', 'standard_monthly', 'premium_monthly'].map((id) => {
        const plan = catalogPlan(id)!
        return { id: plan.id, amount_cents: plan.amountCents, currency: plan.currency, monthly_credits: plan.monthlyCredits, available: checkoutConfigured && Boolean(useWaffo ? env[waffoProductBinding(plan.id)] : env[plan.productBinding]) }
      }),
    },
  }
}

export async function GET() {
  return apiJson(publicConfig(await cloudflareEnv()))
}
