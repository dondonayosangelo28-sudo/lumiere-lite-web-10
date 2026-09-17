/**
 * Central configuration for backend REST API base URL.
 * Uses `import.meta.env.VITE_API_URL` when specified.
 * Uses the deployed Lumiere API as the production fallback so a missing Vercel
 * build variable cannot silently turn API calls into same-origin `/api/*` calls.
 */
const PRODUCTION_API_URL = 'https://lumiere-production-f6a1.up.railway.app'

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:8080' : PRODUCTION_API_URL)

/**
 * Retrieves stored JWT auth token from localStorage or sessionStorage.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('_lumiere_auth_token') || sessionStorage.getItem('_lumiere_auth_token')
}

// Global 401 Interceptor: Intercept window.fetch and emit 'lumiere:unauthorized' event when backend returns HTTP 401
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    const res = await originalFetch.apply(this, args)
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('lumiere:unauthorized'))
    }
    return res
  }
}
