/**
 * Centralized Systemwide Error Converter for Workly
 * Translates backend error codes, HTTP statuses, and message patterns
 * into clean, user-friendly localized messages in VI/EN using i18next `t`.
 */

const ERROR_CODE_MAP = {
  // Auth
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  EMAIL_ALREADY_EXISTS: 'auth.emailExists',
  EMAIL_EXISTS: 'auth.emailExists',
  USER_NOT_FOUND: 'auth.userNotFound',
  PASSWORD_REQUIRED: 'auth.passwordRequired',
  PASSWORD_TOO_SHORT: 'auth.passwordTooShort',
  PASSWORD_MISMATCH: 'auth.passwordMismatch',
  INVALID_EMAIL: 'auth.invalidEmail',
  UNAUTHORIZED: 'error.unauthorized',
  FORBIDDEN: 'error.forbidden',
  NO_REFRESH_TOKEN: 'auth.sessionExpired',
  INVALID_REFRESH_TOKEN: 'auth.sessionExpired',
  SESSION_EXPIRED: 'auth.sessionExpired',

  // Validation
  VALIDATION_ERROR: 'common.validationError',

  // Gigs
  GIG_NOT_FOUND: 'gig.gigNotFound',
  INVALID_GIG_ID: 'gig.invalidGigId',
  INVALID_CATEGORY_ID: 'gig.invalidCategoryId',
  CATEGORY_NOT_FOUND: 'gig.categoryNotFound',
  GIG_CREATE_FAILED: 'gig.createFailed',

  // Reviews
  INVALID_ORDER_ID: 'review.invalidOrderId',
  ORDER_NOT_FOUND: 'review.orderNotFound',
  ORDER_NOT_COMPLETED: 'review.orderNotCompleted',
  ALREADY_REVIEWED: 'review.alreadyReviewed',

  // Freelancer Profile
  FREELANCER_NOT_FOUND: 'freelancer.notFound',
  FREELANCER_ALREADY_EXISTS: 'freelancer.alreadyExists',

  // System
  INTERNAL_ERROR: 'common.serverError',
  BAD_REQUEST: 'common.badRequest',
}

const MESSAGE_PATTERNS = [
  { match: /invalid email or password|incorrect password|wrong password/i, key: 'auth.invalidCredentials' },
  { match: /email already exists/i, key: 'auth.emailExists' },
  { match: /password must be at least 8/i, key: 'auth.passwordTooShort' },
  { match: /password is required/i, key: 'auth.passwordRequired' },
  { match: /passwords do not match|password mismatch/i, key: 'auth.passwordMismatch' },
  { match: /invalid email/i, key: 'auth.invalidEmail' },
  { match: /no refresh token|invalid refresh token|token expired/i, key: 'auth.sessionExpired' },
  { match: /you already reviewed this order/i, key: 'review.alreadyReviewed' },
  { match: /order must be completed/i, key: 'review.orderNotCompleted' },
  { match: /gig not found/i, key: 'gig.gigNotFound' },
  { match: /category not found/i, key: 'gig.categoryNotFound' },
  { match: /unable to buy your own service|cannot buy your own service/i, key: 'gig.cannotBuyOwnService' },
  { match: /forbidden|insufficient permissions/i, key: 'error.forbidden' },
]

export function getErrorMessage(error, t) {
  if (!error) return ''

  // 1. Network / Server connection errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || String(error.message || '').includes('timeout')) {
      return t ? t('common.apiUnavailable') : 'Connection timeout'
    }
    return t ? t('common.apiUnavailable') : 'Network error'
  }

  const { status, data } = error.response

  // 2. Server 500+ Internal Errors
  if (status >= 500) {
    return t ? t('common.serverError') : 'Server error'
  }

  // 3. Match by Backend error code
  const code = data?.code
  if (code && ERROR_CODE_MAP[code]) {
    return t ? t(ERROR_CODE_MAP[code]) : code
  }

  // 4. Match by Backend message pattern
  const rawMessage = String(data?.message || '').trim()
  for (const pattern of MESSAGE_PATTERNS) {
    if (pattern.match.test(rawMessage)) {
      return t ? t(pattern.key) : pattern.key
    }
  }

  // 5. Fallback: Return raw backend message if present
  if (rawMessage) {
    return rawMessage
  }

  return t ? t('common.requestFailed') : 'Request failed'
}

export const getAuthErrorMessage = getErrorMessage
export default getErrorMessage
