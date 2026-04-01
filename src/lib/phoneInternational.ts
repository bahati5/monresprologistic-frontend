/** Pays pour sélecteur téléphone (API `/api/locations/phone-countries`). */
export type PhoneCountryOption = {
  id: number
  name: string
  iso2?: string | null
  phonecode: string
  emoji?: string | null
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

function normalizeDial(code: string): string {
  return digitsOnly(code)
}

/**
 * Trouve le pays dont l’indicatif matche le début du numéro (E.164 sans +).
 * Les codes les plus longs sont testés en premier (ex. +1 vs +12).
 */
export function matchPhoneCountry(
  fullDigits: string,
  countries: PhoneCountryOption[],
): PhoneCountryOption | null {
  if (!fullDigits) return null
  const withCode = countries.filter((c) => c.phonecode && String(c.phonecode).trim() !== '')
  const sorted = [...withCode].sort(
    (a, b) => normalizeDial(String(b.phonecode)).length - normalizeDial(String(a.phonecode)).length,
  )
  for (const c of sorted) {
    const d = normalizeDial(String(c.phonecode))
    if (d && fullDigits.startsWith(d)) return c
  }
  return null
}

export function parseStoredInternational(
  stored: string,
  countries: PhoneCountryOption[],
): { countryId: number | null; nationalDigits: string } {
  const trimmed = stored.trim()
  if (!trimmed) return { countryId: null, nationalDigits: '' }
  const all = digitsOnly(trimmed.startsWith('+') ? trimmed.slice(1) : trimmed)
  if (!all) return { countryId: null, nationalDigits: '' }
  const c = matchPhoneCountry(all, countries)
  if (!c) {
    return { countryId: null, nationalDigits: all }
  }
  const codeLen = normalizeDial(String(c.phonecode)).length
  return { countryId: c.id, nationalDigits: all.slice(codeLen) }
}

export function buildInternational(country: PhoneCountryOption | undefined, nationalDigits: string): string {
  if (!country?.phonecode) return nationalDigits.trim() ? `+${digitsOnly(nationalDigits)}` : ''
  const code = normalizeDial(String(country.phonecode))
  const nat = digitsOnly(nationalDigits)
  if (!code && !nat) return ''
  if (!nat) return `+${code}`
  return `+${code}${nat}`
}
