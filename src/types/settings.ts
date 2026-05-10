/* ── Settings entity types ── */

export interface AppSettings {
  app_name: string
  /** Nom affiché dans la barre latérale ; vide = même valeur que le nom de l'application. */
  hub_brand_name?: string
  app_url: string
  app_email: string
  nit: string
  phone: string
  mobile: string
  phone_secondary?: string
  mobile_secondary?: string
  address: string
  country: string
  /** Code ISO alpha-2 du pays d’identité (lecture seule, calculé par l’API). */
  country_iso2?: string
  /** ID pays (liste emplacements). */
  country_id?: number | '' | null
  /** ID région / province. */
  state_id?: number | '' | null
  /** ID ville (cascade pays → région → ville). */
  city_id?: number | '' | null
  city: string
  postal_code: string
  locker_address: string
  locker_prefix: string
  locker_digits: number
  locker_mode: 'random' | 'sequential'
  auto_verify: boolean
  allow_registration: boolean
  admin_notification: boolean
  timezone: string
  language: string
  currency: string
  currency_symbol: string
  currency_position: 'before' | 'after'
  decimals: number
  number_format: string
  logo_url: string | null
  favicon_url: string | null
  /** À côté du logo dans la sidebar : afficher le nom de l’app (défaut oui). */
  show_sidebar_brand_with_logo?: boolean
}

/** Identité publique (GET /api/branding) — pas besoin du droit manage_settings. */
export interface PublicBranding {
  logo_url: string | null
  favicon_url: string | null
  site_name: string
  hub_brand_name: string
  show_sidebar_brand_with_logo: boolean
  /** Code ISO 4217 (paramètres généraux de l’application). */
  currency: string
  /** Symbole affiché dans l’UI (ex. €, $). */
  currency_symbol: string
  currency_position: 'before' | 'after'
}

export interface Agency {
  id: number
  code: string
  name: string
  slug?: string
  default_currency: string
  exchange_rates?: Record<string, unknown> | null
  is_active: boolean
  users_count?: number
  created_at?: string
  contact_phone?: string | null
  contact_phone_secondary?: string | null
  contact_email?: string | null
  address?: string | null
  country_id?: number | null
  state_id?: number | null
  city_id?: number | null
  country?: { id: number; name: string; code?: string | null; iso2?: string | null; emoji?: string | null } | null
  state?: { id: number; name: string } | null
  city?: { id: number; name: string } | null
}

export interface ShippingMode {
  id: number
  name: string
  code?: string | null
  description: string | null
  is_active: boolean
  sort_order?: number
  volumetric_divisor?: number | null
  /** Règle de calcul du tarif pour ce mode (kg, m³, forfait) */
  default_pricing_type?: 'per_kg' | 'per_volume' | 'flat' | null
  /** Libellés de délai proposés pour l’assistant et les surcharges de ligne */
  delivery_options?: string[]
}

export interface PackagingType {
  id: number
  name: string
  description: string | null
  is_active: boolean
  is_billable?: boolean
  unit_price?: number | string | null
  sort_order?: number
}

export interface TransportCompany {
  id: number
  name: string
  logo_url?: string | null
  logo_path?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  /** @deprecated regrouper contact_* côté UI si besoin */
  contact?: string | null
  is_active: boolean
}

export interface ShipLineRateRow {
  id?: number
  ship_line_id?: number
  shipping_mode_id: number
  /** Si renseigné, remplace le libellé de délai du mode pour ce tarif de ligne uniquement */
  delivery_label_override?: string | null
  unit_price: number
  currency: string
  is_active: boolean
  shipping_mode?: { id: number; name: string } | null
}

export interface ShipLineCountryRef {
  id: number
  name: string
  code?: string | null
  iso2?: string | null
  emoji?: string | null
}

export interface ShipLine {
  id: number
  name: string
  description?: string | null
  is_active: boolean
  origin_countries?: ShipLineCountryRef[]
  destination_countries?: ShipLineCountryRef[]
  rates?: ShipLineRateRow[]
  /** @deprecated champs texte legacy UI */
  origin?: string
  destination?: string
  mode?: string | null
}

export interface ArticleCategory {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

/** Extras de facturation (catalogue) — API `settings/billing-extras`. */
export interface BillingExtra {
  id: number
  agency_id?: number | null
  label: string
  calculation_description?: string | null
  type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
  sort_order?: number
}

export interface PricingRule {
  id: number
  name: string
  type: string
  conditions: Record<string, unknown>
  value: number
  is_active: boolean
}

export interface Zone {
  id: number
  name: string
  countries: number[]
  description: string | null
}

export interface Status {
  id: number
  code: string
  name: string
  color: string
  icon: string | null
  sort_order: number
  is_active: boolean
  entity_type: string
}

export interface WorkflowTransition {
  id: number
  from_status_id: number
  to_status_id: number
  from_status?: Status
  to_status?: Status
  roles: string[]
}

export interface PaymentMethod {
  id: number
  code?: string | null
  name: string
  description: string | null
  is_active: boolean
}

export interface PaymentGatewayConfig {
  gateway: 'paypal' | 'stripe' | 'paystack' | 'wire_transfer'
  is_active: boolean
  config: Record<string, string>
}

export interface AgencyPaymentCoordinate {
  id: number
  agency_id: number
  agency?: Agency
  label: string
  details: string
}

export interface NotificationTemplate {
  id: number
  event: string
  channel: 'email' | 'sms' | 'whatsapp'
  subject: string | null
  body: string
  is_active: boolean
  variables: string[]
}

export interface SmtpConfig {
  host: string
  port: number
  encryption: 'tls' | 'ssl' | 'none'
  username: string
  password: string
  from_email: string
  from_name: string
}

export interface TwilioConfig {
  account_sid: string
  auth_token: string
  from_number: string
  is_active: boolean
  whatsapp_number: string
  whatsapp_active: boolean
}

export interface LocationCountry {
  id: number
  name: string
  iso2: string
  phone_code: string
  is_active: boolean
}

export interface LocationState {
  id: number
  name: string
  country_id: number
  country?: LocationCountry
}

export interface LocationCity {
  id: number
  name: string
  state_id: number
  state?: LocationState
}

export interface LocationData {
  countries: LocationCountry[]
  states: LocationState[]
  cities: LocationCity[]
}
