/**
 * §21.3 — Détecte le pays et le préfixe depuis un numéro de téléphone international.
 * Supporte les formats +243, 0243, 00243, etc.
 */

export interface PhoneCountryInfo {
  code: string       // ISO 3166-1 alpha-2 ex: 'CD'
  name: string       // Nom en français
  dialCode: string   // Préfixe ex: '+243'
  flag: string       // Emoji drapeau
}

const PHONE_PREFIXES: Array<{ dialCode: string; country: PhoneCountryInfo }> = [
  { dialCode: '+243', country: { code: 'CD', name: 'Congo (RDC)', dialCode: '+243', flag: '🇨🇩' } },
  { dialCode: '+242', country: { code: 'CG', name: 'Congo (Brazzaville)', dialCode: '+242', flag: '🇨🇬' } },
  { dialCode: '+241', country: { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' } },
  { dialCode: '+237', country: { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' } },
  { dialCode: '+236', country: { code: 'CF', name: 'Centrafrique', dialCode: '+236', flag: '🇨🇫' } },
  { dialCode: '+235', country: { code: 'TD', name: 'Tchad', dialCode: '+235', flag: '🇹🇩' } },
  { dialCode: '+33',  country: { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' } },
  { dialCode: '+32',  country: { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' } },
  { dialCode: '+41',  country: { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' } },
  { dialCode: '+44',  country: { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' } },
  { dialCode: '+1',   country: { code: 'US', name: 'États-Unis / Canada', dialCode: '+1', flag: '🇺🇸' } },
  { dialCode: '+27',  country: { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' } },
  { dialCode: '+225', country: { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' } },
  { dialCode: '+221', country: { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' } },
  { dialCode: '+212', country: { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' } },
  { dialCode: '+216', country: { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' } },
  { dialCode: '+20',  country: { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' } },
  { dialCode: '+254', country: { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' } },
  { dialCode: '+255', country: { code: 'TZ', name: 'Tanzanie', dialCode: '+255', flag: '🇹🇿' } },
  { dialCode: '+256', country: { code: 'UG', name: 'Ouganda', dialCode: '+256', flag: '🇺🇬' } },
  { dialCode: '+260', country: { code: 'ZM', name: 'Zambie', dialCode: '+260', flag: '🇿🇲' } },
  { dialCode: '+263', country: { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼' } },
  { dialCode: '+86',  country: { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' } },
  { dialCode: '+971', country: { code: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪' } },
  { dialCode: '+974', country: { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' } },
]

/**
 * Normalise un numéro de téléphone en format E.164 si possible.
 * Ex: '00243812345678' → '+243812345678'
 *     '0812345678' (Congo) → ne peut pas être résolu sans contexte, retourne tel quel
 */
export function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return '+' + cleaned.slice(2)
  return raw
}

/**
 * Détecte les informations du pays depuis un numéro de téléphone.
 * Retourne null si non reconnu.
 */
export function detectPhoneCountry(phoneNumber: string): PhoneCountryInfo | null {
  const normalized = normalizePhoneNumber(phoneNumber)

  if (!normalized.startsWith('+')) return null

  // Tri par longueur décroissante pour privilégier les préfixes les plus longs
  const sorted = [...PHONE_PREFIXES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  )

  for (const { dialCode, country } of sorted) {
    if (normalized.startsWith(dialCode)) {
      return country
    }
  }

  return null
}

/**
 * Hook React pour détecter le pays depuis un numéro de téléphone.
 * @example
 *   const country = usePhoneCountry('+243812345678')
 *   // { code: 'CD', name: 'Congo (RDC)', dialCode: '+243', flag: '🇨🇩' }
 */
export function usePhoneCountry(phoneNumber: string): PhoneCountryInfo | null {
  if (!phoneNumber?.trim()) return null
  return detectPhoneCountry(phoneNumber)
}

/**
 * §21.5 — Configuration des champs de formulaire adaptatifs selon le pays de destination.
 */
export interface CountryFormConfig {
  requiresPostalCode: boolean
  postalCodePattern: string | null
  postalCodePlaceholder: string
  postalCodeLabel: string
  requiresState: boolean
  requiresCity: boolean
  addressFormat: 'standard' | 'compact'
  phoneFormat: string
}

const COUNTRY_FORM_CONFIGS: Record<string, CountryFormConfig> = {
  CD: {
    requiresPostalCode: false,
    postalCodePattern: null,
    postalCodePlaceholder: '',
    postalCodeLabel: 'Code postal',
    requiresState: false,
    requiresCity: true,
    addressFormat: 'compact',
    phoneFormat: '+243 8XX XXX XXX',
  },
  CG: {
    requiresPostalCode: false,
    postalCodePattern: null,
    postalCodePlaceholder: '',
    postalCodeLabel: 'Code postal',
    requiresState: false,
    requiresCity: true,
    addressFormat: 'compact',
    phoneFormat: '+242 06X XXX XXX',
  },
  FR: {
    requiresPostalCode: true,
    postalCodePattern: '^\\d{5}$',
    postalCodePlaceholder: '75001',
    postalCodeLabel: 'Code postal',
    requiresState: false,
    requiresCity: true,
    addressFormat: 'standard',
    phoneFormat: '+33 6XX XXX XXX',
  },
  BE: {
    requiresPostalCode: true,
    postalCodePattern: '^\\d{4}$',
    postalCodePlaceholder: '1000',
    postalCodeLabel: 'Code postal',
    requiresState: false,
    requiresCity: true,
    addressFormat: 'standard',
    phoneFormat: '+32 4XX XXX XXX',
  },
  US: {
    requiresPostalCode: true,
    postalCodePattern: '^\\d{5}(-\\d{4})?$',
    postalCodePlaceholder: '10001',
    postalCodeLabel: 'ZIP Code',
    requiresState: true,
    requiresCity: true,
    addressFormat: 'standard',
    phoneFormat: '+1 (XXX) XXX-XXXX',
  },
  GB: {
    requiresPostalCode: true,
    postalCodePattern: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$',
    postalCodePlaceholder: 'SW1A 1AA',
    postalCodeLabel: 'Postcode',
    requiresState: false,
    requiresCity: true,
    addressFormat: 'standard',
    phoneFormat: '+44 7XXX XXX XXX',
  },
  CN: {
    requiresPostalCode: true,
    postalCodePattern: '^\\d{6}$',
    postalCodePlaceholder: '100000',
    postalCodeLabel: '邮编 (Code postal)',
    requiresState: true,
    requiresCity: true,
    addressFormat: 'standard',
    phoneFormat: '+86 1XX XXXX XXXX',
  },
}

const DEFAULT_FORM_CONFIG: CountryFormConfig = {
  requiresPostalCode: false,
  postalCodePattern: null,
  postalCodePlaceholder: '',
  postalCodeLabel: 'Code postal',
  requiresState: false,
  requiresCity: true,
  addressFormat: 'standard',
  phoneFormat: '',
}

/**
 * Retourne la configuration de formulaire adaptée au pays de destination.
 * @param countryCode Code ISO 3166-1 alpha-2 (ex: 'CD', 'FR', 'US')
 */
export function getCountryFormConfig(countryCode: string | null | undefined): CountryFormConfig {
  if (!countryCode) return DEFAULT_FORM_CONFIG
  return COUNTRY_FORM_CONFIGS[countryCode.toUpperCase()] ?? DEFAULT_FORM_CONFIG
}
