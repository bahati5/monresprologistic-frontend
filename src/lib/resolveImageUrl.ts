/**
 * Resolve image URL by prepending API base URL for relative paths.
 * Handles both absolute URLs (http/https) and relative paths.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  // Already absolute URL (starts with http:// or https://)
  if (/^https?:\/\//i.test(url)) return url
  // Relative path - prepend API base URL
  const baseURL = import.meta.env.DEV
    ? window.location.origin
    : (import.meta.env.VITE_API_URL || window.location.origin)
  const cleanBase = baseURL.replace(/\/$/, '')
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  return `${cleanBase}${cleanPath}`
}
