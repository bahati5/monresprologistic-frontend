const REGIONAL_INDICATOR_A = 0x1f1e6

/** ISO 3166-1 alpha-2 → drapeau (ex. FR → 🇫🇷). Invalide si ce n’est pas exactement 2 lettres A–Z. */
export function iso2ToFlagEmoji(iso2: string | null | undefined): string | null {
  if (!iso2) return null
  const upper = iso2.toUpperCase().trim()
  if (upper.length !== 2 || !/^[A-Z]{2}$/.test(upper)) return null
  const a = upper.codePointAt(0)! - 65
  const b = upper.codePointAt(1)! - 65
  if (a < 0 || a > 25 || b < 0 || b > 25) return null
  return String.fromCodePoint(REGIONAL_INDICATOR_A + a, REGIONAL_INDICATOR_A + b)
}

/** Préfère l’emoji stocké en base, sinon déduit depuis iso2 puis depuis un code à 2 lettres. */
export function resolveCountryFlagEmoji(
  emoji: string | null | undefined,
  iso2: string | null | undefined,
  code: string | null | undefined
): string | null {
  const trimmed = emoji?.trim()
  if (trimmed) return trimmed
  const fromIso = iso2ToFlagEmoji(iso2)
  if (fromIso) return fromIso
  return iso2ToFlagEmoji(code)
}

/** ISO 3166-1 alpha-2 pour URL type flagcdn (uniquement 2 lettres A–Z). */
export function pickIso2ForFlag(iso2: string | null | undefined, code: string | null | undefined): string | null {
  const i = iso2?.trim().toUpperCase()
  if (i && /^[A-Z]{2}$/.test(i)) return i
  const c = code?.trim().toUpperCase()
  if (c && /^[A-Z]{2}$/.test(c)) return c
  return null
}
