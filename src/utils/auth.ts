export const AUTH_COOKIE_KEY = 'crm_auth_token'
const AUTH_COOKIE_HOURS = 12

export function setAuthCookie(token: string, hours: number = AUTH_COOKIE_HOURS) {
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString()
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(token)}; expires=${expires}; path=/`
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export function getAuthToken() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE_KEY}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function isAuthenticated() {
  return !!getAuthToken()
}

