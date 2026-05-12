/**
 * Correspondance d’URL pour la navigation : un seul lien actif à la fois.
 * Parmi les hrefs du menu, on retient le plus long qui correspond à l’URL courante
 * (égalité stricte ou préfixe suivi de « / »), pour éviter que `/analytics` reste actif
 * sur `/analytics/achat-assiste`, etc.
 */

export function normalizePathname(pathname: string): string {
  const p = pathname || '/'
  if (p.length > 1 && p.endsWith('/')) {
    return p.slice(0, -1)
  }
  return p
}

/**
 * @param pathname — ex. location.pathname
 * @param hrefs — tous les hrefs visibles dans la barre latérale (toutes sections)
 * @returns le href « gagnant » normalisé, ou null
 */
export function resolveActiveNavHref(pathname: string, hrefs: string[]): string | null {
  const path = normalizePathname(pathname)
  const normalizedUnique = [...new Set(hrefs.filter(Boolean).map((h) => normalizePathname(h)))].sort(
    (a, b) => b.length - a.length,
  )

  for (const href of normalizedUnique) {
    if (path === href || path.startsWith(`${href}/`)) {
      return href
    }
  }
  return null
}

export function isNavHrefActive(itemHref: string, activeHref: string | null): boolean {
  if (activeHref == null) return false
  return normalizePathname(itemHref) === activeHref
}
