const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '')

export function resolveMediaUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${apiOrigin}/${String(value).replace(/^\/+/, '')}`
}
