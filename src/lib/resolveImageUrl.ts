/**
 * Résout l’URL d’une image : URLs absolues inchangées ; chemins relatifs préfixés par l’origine API.
 * Retire un suffixe `/api` sur VITE_API_URL (erreur fréquente) pour ne pas produire `/api/storage/...`.
 * En dev, VITE_DEV_API_ORIGIN (ex. http://localhost:8000) force l’hôte des fichiers /storage si le proxy échoue.
 */
function assetBaseUrl(): string {
  if (import.meta.env.DEV) {
    const explicit = String(import.meta.env.VITE_DEV_API_ORIGIN || '').replace(/\/$/, '')
    if (explicit) return explicit
    return window.location.origin.replace(/\/$/, '')
  }
  const raw = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')
  return raw.replace(/\/api$/i, '')
}

/**
 * Resolve image URL by prepending API base URL for relative paths.
 * Handles both absolute URLs (http/https) and relative paths.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  // Already absolute URL (starts with http:// or https://)
  if (/^https?:\/\//i.test(url)) return url
  // Chemin relatif : même origine en dev (proxy Vite /storage), sinon origine API sans /api
  const cleanBase = assetBaseUrl()
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  return `${cleanBase}${cleanPath}`
}
