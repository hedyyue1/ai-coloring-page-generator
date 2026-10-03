export type ErrorContext = 'photo' | 'preview' | 'download' | 'checkout' | 'login' | 'request'

const support = 'support@coloringpageflow.com'
const purchasesUnavailable = 'Paid subscriptions are not available for purchase right now. Check your account or contact support; do not repeat a payment to fix missing access.'
const fallback: Record<ErrorContext, string> = {
  photo: `We could not create a preview from this photo. Try another image or contact ${support}.`,
  preview: `We could not save a downloadable copy of your preview. Try creating the preview again or contact ${support}. Your original photo was not uploaded.`,
  download: `We could not download this coloring page. Check your connection and try again, or contact ${support}.`,
  checkout: purchasesUnavailable,
  login: `Google sign-in did not finish. Please try again or contact ${support}.`,
  request: `We could not complete this request. Reload the page and try again, or contact ${support}.`,
}

const shared: Record<string, string> = {
  authentication_required: 'Sign in with Google to continue.',
  auth_required: 'Sign in with Google to download your coloring page.',
  session_expired: 'Your session has ended. Sign in with Google again to continue.',
  origin_forbidden: 'We could not complete this request from this page. Reload the page and try again.',
  csrf_failed: 'We could not confirm this request. Reload the page and try again.',
  idempotency_key_required: 'We could not submit this request. Reload the page and try again.',
  idempotency_key_reused: 'This request could not be completed. Reload the page before trying again.',
}

const messages: Partial<Record<ErrorContext, Record<string, string>>> = {
  photo: {
    image_unreadable: 'The selected photo could not be read. Choose a different PNG, JPG or WebP photo.',
    browser_processing_unavailable: 'We could not process the photo in this browser. Try another browser.',
    browser_output_unavailable: 'We could not create the preview in this browser. Try another browser.',
    preview_save_failed: fallback.preview,
    preview_response_missing: 'We could not prepare your preview for download. Try creating it again or contact support.',
  },
  preview: {
    invalid_request: fallback.preview,
    invalid_result: fallback.preview,
  },
  download: {
    subscription_required: 'This download requires an eligible paid subscription. New purchases are currently unavailable. Check your account or contact support; do not pay to unlock a download.',
    invalid_request: 'We could not identify this preview. Create a new preview and try again.',
    invalid_preview: 'We could not identify this preview. Create a new preview and try again.',
    preview_expired: 'This preview is no longer available. Create a new preview to try downloading again.',
  },
  checkout: {
    payments_disabled: purchasesUnavailable,
    checkout_not_configured: purchasesUnavailable,
    checkout_provider_error: purchasesUnavailable,
    plan_not_available: purchasesUnavailable,
    invalid_request: 'We could not read your checkout request. Reload the page and try again. Paid subscriptions are not available for purchase right now.',
  },
  login: {
    oauth_not_configured: `Google sign-in is unavailable right now. Please try again later or contact ${support}.`,
    sign_in_cancelled: 'You did not finish signing in. You can continue with Google when you are ready.',
    invalid_oauth_state: 'This sign-in attempt could not be confirmed. Start again with Continue with Google.',
    sign_in_failed: fallback.login,
    account_link_attention: 'We could not complete access to your account. Contact support for help.',
  },
}

// Only known codes select trusted copy. Never use response.error.message or Error.message.
export function userFacingError(code: unknown, context: ErrorContext = 'request'): string {
  if (typeof code !== 'string') return fallback[context]
  const scoped = messages[context]
  if (scoped && Object.hasOwn(scoped, code)) return scoped[code]
  if (context !== 'login' && Object.hasOwn(shared, code)) return shared[code]
  return fallback[context]
}

export class UserFacingError extends Error {
  constructor(readonly code: string, readonly context: ErrorContext) {
    super('A user-facing operation failed')
    this.name = 'UserFacingError'
  }
}

export function operationError(error: unknown, context: ErrorContext): string {
  return error instanceof UserFacingError
    ? userFacingError(error.code, error.context)
    : userFacingError(undefined, context)
}
