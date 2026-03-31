export type UiLocale = 'en' | 'fr'

/** Locale UI simple : navigateur (en*) sinon français par défaut. */
export function getUiLocale(): UiLocale {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) return 'en'
  return 'fr'
}

/**
 * Aplatit une valeur API qui peut être une chaîne ou un objet traduit { en, fr }.
 */
export function resolveLocalized(value: unknown, locale: UiLocale = getUiLocale()): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>
    if ('en' in o || 'fr' in o) {
      const pick = o[locale] ?? o.fr ?? o.en
      return resolveLocalized(pick, locale)
    }
  }
  return ''
}

/** Affichage table / badge : chaîne ou tiret si vide. */
export function displayLocalized(value: unknown, empty = '-', locale?: UiLocale): string {
  const s = resolveLocalized(value, locale)
  return s || empty
}
