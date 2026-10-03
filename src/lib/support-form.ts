export const supportCategories = [
  ['account', 'Account or Google sign-in'], ['payment', 'Payment or subscription'],
  ['generation', 'Coloring page or download'], ['deletion', 'Privacy or data deletion'],
  ['refund', 'Refund request'], ['complaint', 'Complaint or policy concern'], ['other', 'Something else'],
] as const
export type SupportFields = { category: string; email: string; reference: string; message: string }
export const supportMessages = {
  category: 'Choose a topic so we can understand your request.',
  email: 'Enter a valid email address where you can receive a reply.',
  message: 'Please describe the problem in at least 10 characters.',
  longMessage: 'Please shorten your message to 4,000 characters or fewer.',
  reference: 'Use up to 128 letters, numbers, dots, underscores, colons or hyphens, or leave the reference blank.',
  invalid: 'Please check your email, reference and message, then try again.',
  large: 'Your request is too long to send. Shorten the message and remove any pasted images or documents, then try again.',
  limited: 'We cannot accept another request right now. Please wait an hour before trying again, or email support@coloringpageflow.com.',
  rejected: 'We could not send your request from this page. Reload the Support page and try again, or email support@coloringpageflow.com.',
  unavailable: 'We could not save your request right now. Try again later, or email support@coloringpageflow.com.',
  unknown: 'We could not confirm whether your request was received. Check your connection before trying again. If you contact us by email, mention the earlier attempt.',
}
export function validateSupport(fields: SupportFields): Partial<Record<keyof SupportFields, string>> {
  const errors: Partial<Record<keyof SupportFields, string>> = {}
  if (!supportCategories.some(([value]) => value === fields.category)) errors.category = supportMessages.category
  const email = fields.email.trim().toLowerCase()
  if (email.length > 254 || email.split('@')[0].length > 64 ||
    !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email) ||
    email.startsWith('.') || email.includes('..') || email.includes('.@')) errors.email = supportMessages.email
  const length = Array.from(fields.message.trim()).length
  if (length < 10) errors.message = supportMessages.message
  else if (length > 4000) errors.message = supportMessages.longMessage
  else if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(fields.message)) errors.message = supportMessages.invalid
  if (fields.reference.trim() && !/^[a-zA-Z0-9_.:-]{1,128}$/.test(fields.reference.trim())) errors.reference = supportMessages.reference
  return errors
}
export function supportError(status: number): string {
  if (status === 400) return supportMessages.invalid
  if (status === 413) return supportMessages.large
  if (status === 429) return supportMessages.limited
  if (status === 403 || status === 415) return supportMessages.rejected
  if (status === 503) return supportMessages.unavailable
  return supportMessages.unknown
}
export function supportTicket(status: number, payload: unknown): string | null {
  if (status !== 201 || !payload || typeof payload !== 'object' || !('data' in payload)) return null
  const data = payload.data
  if (!data || typeof data !== 'object' || !('ticket_id' in data) || typeof data.ticket_id !== 'string') return null
  return /^sup_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.ticket_id) ? data.ticket_id : null
}
